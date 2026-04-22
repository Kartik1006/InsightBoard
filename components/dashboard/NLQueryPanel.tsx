'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { executeSQL, buildSchemaDescription, SQLResult } from '@/lib/sqlEngine';
import { ChartRecommendation } from '@/lib/types';
import { buildAdvancedCustomChart } from '@/lib/analyzer';
import { useTheme } from 'next-themes';
import { ChartWidget } from './ChartWidget';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Play,
    Loader2,
    Database,
    Clock,
    Trash2,
    Code2,
    ChevronDown,
    ChevronUp,
    Table2,
    BarChart3,
    Sparkles,
    AlertCircle,
    Edit3,
    Copy,
    Check,
} from 'lucide-react';

interface QueryHistoryItem {
    question: string;
    sql: string;
    timestamp: number;
    rowCount: number;
}

const EXAMPLE_QUESTIONS = [
    "Show total revenue by country",
    "What are the top 10 products by sales?",
    "Average price grouped by category",
    "Count of records where status is 'Active'",
    "Show monthly sales trend",
    "Which region has the highest profit?",
    "List all unique categories",
    "Sum of quantity by product type, sorted descending",
];

export function NLQueryPanel() {
    const { state } = useDataStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const dataset = state.cleanedDataset;

    const [question, setQuestion] = useState('');
    const [sqlQuery, setSqlQuery] = useState('');
    const [isEditingSQL, setIsEditingSQL] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<SQLResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<QueryHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [resultView, setResultView] = useState<'table' | 'chart'>('table');
    const [autoChart, setAutoChart] = useState<ChartRecommendation | null>(null);
    const [copied, setCopied] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 50;

    const schema = useMemo(() => {
        if (!dataset) return '';
        return buildSchemaDescription(dataset.columns);
    }, [dataset]);

    const handleAsk = useCallback(async () => {
        if (!question.trim() || !dataset) return;
        setGenerating(true);
        setError(null);
        setResult(null);
        setAutoChart(null);
        setSqlQuery('');

        try {
            const response = await fetch('/api/nl-to-sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question.trim(), schema }),
            });
            const data = await response.json();

            if (data.error) {
                setError(data.error);
                setGenerating(false);
                return;
            }

            const sql = data.sql;
            setSqlQuery(sql);
            setGenerating(false);

            // Now execute the SQL
            executeQuery(sql);
        } catch {
            setError('Failed to generate SQL query. Check your connection.');
            setGenerating(false);
        }
    }, [question, dataset, schema]);

    const executeQuery = useCallback((sql: string) => {
        if (!dataset) return;
        setLoading(true);
        setError(null);
        setCurrentPage(0);

        // Use setTimeout to not block UI
        setTimeout(() => {
            const sqlResult = executeSQL(dataset.rows, sql);

            if (sqlResult.error) {
                setError(sqlResult.error);
                setResult(null);
            } else {
                setResult(sqlResult);

                // Try to auto-generate a chart from results
                if (sqlResult.columns.length >= 2 && sqlResult.rows.length >= 2) {
                    try {
                        const numericCols = sqlResult.columns.filter(col =>
                            sqlResult.rows.some(r => typeof r[col] === 'number' && !isNaN(Number(r[col])))
                        );
                        const stringCols = sqlResult.columns.filter(col =>
                            sqlResult.rows.some(r => typeof r[col] === 'string')
                        );

                        if (stringCols.length > 0 && numericCols.length > 0) {
                            const tempDataset = {
                                ...dataset,
                                rows: sqlResult.rows,
                                rowCount: sqlResult.rowCount,
                                columns: sqlResult.columns.map(name => ({
                                    name,
                                    type: numericCols.includes(name) ? 'number' as const : 'string' as const,
                                    uniqueCount: new Set(sqlResult.rows.map(r => r[name])).size,
                                    nullCount: 0,
                                    totalCount: sqlResult.rowCount,
                                    sampleValues: sqlResult.rows.slice(0, 5).map(r => r[name] as string | number | boolean | null),
                                })),
                                columnCount: sqlResult.columns.length,
                            };
                            const chart = buildAdvancedCustomChart(
                                tempDataset,
                                stringCols[0],
                                numericCols.slice(0, 3),
                                null,
                                numericCols.length > 1 ? 'bar' : 'bar',
                                'sum',
                                'value-desc',
                                20,
                                false,
                                question.trim(),
                                isDark
                            );
                            setAutoChart(chart);
                        }
                    } catch {
                        // Chart generation failed, that's fine
                    }
                }

                // Add to history
                setHistory(prev => [{
                    question: question.trim(),
                    sql,
                    timestamp: Date.now(),
                    rowCount: sqlResult.rowCount,
                }, ...prev.slice(0, 19)]);
            }

            setLoading(false);
        }, 50);
    }, [dataset, question, isDark]);

    const handleCopySQL = useCallback(() => {
        navigator.clipboard.writeText(sqlQuery);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [sqlQuery]);

    const handleHistoryClick = useCallback((item: QueryHistoryItem) => {
        setQuestion(item.question);
        setSqlQuery(item.sql);
        setShowHistory(false);
        executeQuery(item.sql);
    }, [executeQuery]);

    if (!dataset) return null;

    const totalPages = result ? Math.ceil(result.rows.length / pageSize) : 0;
    const paginatedRows = result ? result.rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
            {/* Query Input Section */}
            <div className="nl-query-panel" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div className="ai-glow" />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        <Database size={18} style={{ color: 'var(--accent-primary)' }} />
                        Ask Your Data
                        <span style={{
                            fontSize: '0.5625rem',
                            fontWeight: 600,
                            color: '#a78bfa',
                            background: 'rgba(167, 139, 250, 0.12)',
                            padding: '0.125rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}>
                            AI + SQL
                        </span>
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn-icon"
                            onClick={() => setShowExamples(!showExamples)}
                            title="Example questions"
                            style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', gap: '0.25rem' }}
                        >
                            <Sparkles size={13} />
                            Examples
                        </button>
                        {history.length > 0 && (
                            <button
                                className="btn-icon"
                                onClick={() => setShowHistory(!showHistory)}
                                title="Query history"
                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', gap: '0.25rem' }}
                            >
                                <Clock size={13} />
                                History ({history.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Example Questions */}
                <AnimatePresence>
                    {showExamples && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginBottom: '0.75rem' }}
                        >
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.375rem',
                                padding: '0.75rem',
                                background: 'var(--bg-card-hover)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                {EXAMPLE_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setQuestion(q); setShowExamples(false); }}
                                        style={{
                                            padding: '0.375rem 0.75rem',
                                            fontSize: '0.75rem',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-primary)',
                                            borderRadius: 'var(--radius-full)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                            e.currentTarget.style.color = 'var(--text-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border-primary)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* History Dropdown */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginBottom: '0.75rem' }}
                        >
                            <div style={{
                                background: 'var(--bg-card-hover)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.5rem',
                                maxHeight: 200,
                                overflowY: 'auto',
                            }}>
                                {history.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleHistoryClick(item)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            background: 'transparent',
                                            border: 'none',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.75rem',
                                            textAlign: 'left',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.question}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginLeft: '0.75rem', flexShrink: 0 }}>
                                            {item.rowCount} rows
                                        </span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setHistory([]); setShowHistory(false); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--danger)',
                                        fontSize: '0.6875rem',
                                        marginTop: '0.25rem',
                                    }}
                                >
                                    <Trash2 size={12} /> Clear history
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Bar */}
                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'stretch' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }} />
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && !generating) handleAsk(); }}
                            placeholder="Ask a question about your data in plain English..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                outline: 'none',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-primary)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleAsk}
                        disabled={!question.trim() || loading || generating}
                        style={{
                            padding: '0.75rem 1.25rem',
                            opacity: question.trim() && !loading && !generating ? 1 : 0.5,
                            cursor: question.trim() && !loading && !generating ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {generating ? (
                            <><Loader2 size={15} className="spin-icon" /> Generating...</>
                        ) : loading ? (
                            <><Loader2 size={15} className="spin-icon" /> Running...</>
                        ) : (
                            <><Play size={15} /> Ask</>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.75rem',
                            padding: '0.625rem 0.75rem',
                            background: 'var(--danger-bg)',
                            borderLeft: '3px solid var(--danger)',
                            borderRadius: '4px',
                            fontSize: '0.8125rem',
                            color: 'var(--danger)',
                        }}
                    >
                        <AlertCircle size={14} />
                        {error}
                    </motion.div>
                )}
            </div>

            {/* Generated SQL Display */}
            {sqlQuery && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-primary)',
                        background: 'var(--bg-card-hover)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <Code2 size={14} />
                            Generated SQL
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button
                                className="btn-icon"
                                onClick={() => setIsEditingSQL(!isEditingSQL)}
                                title="Edit SQL"
                                style={{ padding: '0.25rem' }}
                            >
                                <Edit3 size={13} />
                            </button>
                            <button
                                className="btn-icon"
                                onClick={handleCopySQL}
                                title="Copy SQL"
                                style={{ padding: '0.25rem' }}
                            >
                                {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                            </button>
                            {isEditingSQL && (
                                <button
                                    className="btn-secondary"
                                    onClick={() => { executeQuery(sqlQuery); setIsEditingSQL(false); }}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                                >
                                    <Play size={11} /> Re-run
                                </button>
                            )}
                        </div>
                    </div>
                    {isEditingSQL ? (
                        <textarea
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            className="sql-editor"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'var(--bg-input)',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                                fontSize: '0.8125rem',
                                lineHeight: 1.6,
                                resize: 'vertical',
                                minHeight: 80,
                                outline: 'none',
                            }}
                        />
                    ) : (
                        <pre style={{
                            padding: '1rem',
                            margin: 0,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            fontSize: '0.8125rem',
                            lineHeight: 1.6,
                            color: '#a78bfa',
                            overflowX: 'auto',
                        }}>
                            {sqlQuery}
                        </pre>
                    )}
                </motion.div>
            )}

            {/* Results Section */}
            {result && result.rows.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Results Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-primary)',
                        background: 'var(--bg-card-hover)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {result.rowCount.toLocaleString()} rows · {result.columns.length} columns · {result.executionTimeMs.toFixed(0)}ms
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                                onClick={() => setResultView('table')}
                                style={{
                                    padding: '0.375rem 0.625rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid ' + (resultView === 'table' ? 'var(--accent-primary)' : 'var(--border-primary)'),
                                    background: resultView === 'table' ? 'var(--accent-glow)' : 'transparent',
                                    color: resultView === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <Table2 size={12} /> Table
                            </button>
                            {autoChart && (
                                <button
                                    onClick={() => setResultView('chart')}
                                    style={{
                                        padding: '0.375rem 0.625rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid ' + (resultView === 'chart' ? 'var(--accent-primary)' : 'var(--border-primary)'),
                                        background: resultView === 'chart' ? 'var(--accent-glow)' : 'transparent',
                                        color: resultView === 'chart' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.6875rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <BarChart3 size={12} /> Chart
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table or Chart */}
                    {resultView === 'table' ? (
                        <div style={{ overflowX: 'auto', maxHeight: 500 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {result.columns.map((col) => (
                                            <th key={col}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.map((row, i) => (
                                        <tr key={i}>
                                            {result.columns.map((col) => (
                                                <td key={col}>
                                                    {row[col] === null || row[col] === undefined
                                                        ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>
                                                        : typeof row[col] === 'number'
                                                            ? (row[col] as number).toLocaleString()
                                                            : String(row[col])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : autoChart ? (
                        <div style={{ padding: '1rem' }}>
                            <ChartWidget chart={autoChart} index={0} enableFlip={false} />
                        </div>
                    ) : null}

                    {/* Pagination */}
                    {totalPages > 1 && resultView === 'table' && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.625rem 1rem',
                            borderTop: '1px solid var(--border-primary)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                        }}>
                            <span>Page {currentPage + 1} of {totalPages}</span>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                                <button
                                    className="btn-icon"
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
                                >
                                    <ChevronUp size={14} style={{ transform: 'rotate(-90deg)' }} />
                                </button>
                                <button
                                    className="btn-icon"
                                    disabled={currentPage >= totalPages - 1}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                    style={{ opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}
                                >
                                    <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Empty result */}
            {result && result.rows.length === 0 && !error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-primary)',
                    }}
                >
                    <Database size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No results found. Try rephrasing your question.</p>
                </motion.div>
            )}
        </motion.div>
    );
}
