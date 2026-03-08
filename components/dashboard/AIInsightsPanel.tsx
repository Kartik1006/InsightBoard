'use client';

import { useState, useCallback } from 'react';
import { CleanedDataset } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Loader2,
    TrendingUp,
    AlertTriangle,
    PieChart,
    GitBranch,
    Lightbulb,
    RefreshCw,
} from 'lucide-react';

interface AIInsight {
    text: string;
    category: 'trend' | 'outlier' | 'distribution' | 'correlation';
    alertLevel: 'success' | 'warning' | 'danger' | 'neutral';
}

interface AIInsightsPanelProps {
    dataset: CleanedDataset;
}

const insightIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    trend: TrendingUp,
    outlier: AlertTriangle,
    distribution: PieChart,
    correlation: GitBranch,
};

const alertStyles: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: 'var(--success-bg)', border: 'var(--success)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--warning)' },
    danger: { bg: 'var(--danger-bg)', border: 'var(--danger)', color: 'var(--danger)' },
    neutral: { bg: 'var(--bg-card-hover)', border: 'var(--border-secondary)', color: 'var(--text-secondary)' },
};

function buildDataSummary(dataset: CleanedDataset): string {
    const lines: string[] = [];
    lines.push(`File: ${dataset.fileName}`);
    lines.push(`Rows: ${dataset.rowCount}, Columns: ${dataset.columnCount}`);
    lines.push('');
    lines.push('Columns:');
    for (const col of dataset.columns) {
        let desc = `- ${col.name} (${col.type}, ${col.uniqueCount} unique)`;
        if (col.type === 'number' && col.stats) {
            desc += ` min=${col.stats.min}, max=${col.stats.max}, mean=${col.stats.mean?.toFixed(2)}, median=${col.stats.median}`;
        }
        if (col.topValues) {
            const top3 = col.topValues.slice(0, 3).map((v: { value: string; count: number }) => `${v.value}(${v.count})`).join(', ');
            desc += ` top: ${top3}`;
        }
        lines.push(desc);
    }
    // Add first 5 sample rows
    lines.push('');
    lines.push('Sample rows (first 5):');
    for (const row of dataset.rows.slice(0, 5)) {
        const vals = dataset.columns.map((c: { name: string }) => `${c.name}=${row[c.name]}`).join(', ');
        lines.push(`  ${vals}`);
    }
    return lines.join('\n');
}

export function AIInsightsPanel({ dataset }: AIInsightsPanelProps) {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    const generateInsights = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dataSummary = buildDataSummary(dataset);
            const response = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataSummary }),
            });
            const data = await response.json();
            if (data.insights && data.insights.length > 0) {
                setInsights(data.insights);
                setHasGenerated(true);
            } else {
                setError('No insights generated. Try again.');
            }
        } catch {
            setError('Failed to connect to AI. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [dataset]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
                marginBottom: '1.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated gradient border accent */}
            <div className="ai-glow" />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: hasGenerated ? '0.75rem' : 0,
                }}
            >
                <h3
                    style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Sparkles size={15} className="sparkle-icon" style={{ color: '#a78bfa' }} />
                    AI Insights
                    <span
                        style={{
                            fontSize: '0.5625rem',
                            fontWeight: 600,
                            color: '#a78bfa',
                            background: 'rgba(167, 139, 250, 0.12)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Gemini
                    </span>
                </h3>

                <button
                    onClick={generateInsights}
                    disabled={loading}
                    className="btn-secondary"
                    style={{
                        fontSize: '0.75rem',
                        padding: '0.375rem 0.75rem',
                        gap: '0.375rem',
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? (
                        <Loader2 size={13} className="spin-icon" />
                    ) : hasGenerated ? (
                        <RefreshCw size={13} />
                    ) : (
                        <Sparkles size={13} />
                    )}
                    {loading ? 'Analyzing...' : hasGenerated ? 'Refresh' : 'Generate Insights'}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--danger)',
                        padding: '0.5rem 0',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Insights grid */}
            <AnimatePresence mode="wait">
                {insights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '0.5rem',
                        }}
                    >
                        {insights.map((insight, i) => {
                            const Icon = insightIcons[insight.category] || Lightbulb;
                            const alert = alertStyles[insight.alertLevel] || alertStyles.neutral;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.625rem',
                                        padding: '0.625rem 0.75rem',
                                        background: alert.bg,
                                        borderLeft: `3px solid ${alert.border}`,
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        lineHeight: 1.5,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <Icon size={14} style={{ color: alert.color, flexShrink: 0, marginTop: 2 }} />
                                    <span>{insight.text}</span>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {!hasGenerated && !loading && (
                <p
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.5rem',
                    }}
                >
                    Click &ldquo;Generate Insights&rdquo; to get AI-powered analysis of your data.
                </p>
            )}
        </motion.div>
    );
}
