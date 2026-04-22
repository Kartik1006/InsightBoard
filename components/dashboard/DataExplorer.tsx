'use client';

import { useState, useMemo } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { motion } from 'framer-motion';
import {
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Table2,
    Hash,
    Type,
    Calendar,
    ToggleLeft,
} from 'lucide-react';

const typeIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    number: Hash,
    string: Type,
    date: Calendar,
    boolean: ToggleLeft,
};

export function DataExplorer() {
    const { state } = useDataStore();
    const dataset = state.cleanedDataset;

    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(0);
    const [hoveredCol, setHoveredCol] = useState<string | null>(null);
    const pageSize = 100;

    const filteredAndSortedRows = useMemo(() => {
        if (!dataset) return [];
        let rows = [...dataset.rows];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter(row =>
                dataset.columns.some(col => {
                    const val = row[col.name];
                    if (val == null) return false;
                    return String(val).toLowerCase().includes(term);
                })
            );
        }

        // Sort
        if (sortColumn) {
            const colMeta = dataset.columns.find(c => c.name === sortColumn);
            rows.sort((a, b) => {
                const aVal = a[sortColumn!];
                const bVal = b[sortColumn!];
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                let cmp: number;
                if (colMeta?.type === 'number') {
                    cmp = Number(aVal) - Number(bVal);
                } else {
                    cmp = String(aVal).localeCompare(String(bVal));
                }
                return sortDirection === 'asc' ? cmp : -cmp;
            });
        }

        return rows;
    }, [dataset, searchTerm, sortColumn, sortDirection]);

    if (!dataset) return null;

    const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize);
    const paginatedRows = filteredAndSortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const handleSort = (colName: string) => {
        if (sortColumn === colName) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(colName);
            setSortDirection('asc');
        }
        setCurrentPage(0);
    };

    const getColStats = (colName: string) => {
        const col = dataset.columns.find(c => c.name === colName);
        if (!col) return null;
        return col;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Table2 size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Data Explorer
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {filteredAndSortedRows.length.toLocaleString()} of {dataset.rowCount.toLocaleString()} rows
                    </span>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', width: 280 }}>
                    <Search size={14} style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                    }} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                        placeholder="Search across all columns..."
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem 0.5rem 2rem',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8125rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto', maxHeight: 600 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 50, textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
                                {dataset.columns.map((col) => {
                                    const TypeIcon = typeIcons[col.type] || Type;
                                    const isSorted = sortColumn === col.name;
                                    const stats = hoveredCol === col.name ? getColStats(col.name) : null;

                                    return (
                                        <th
                                            key={col.name}
                                            onClick={() => handleSort(col.name)}
                                            onMouseEnter={() => setHoveredCol(col.name)}
                                            onMouseLeave={() => setHoveredCol(null)}
                                            style={{
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                position: 'relative',
                                                transition: 'background 0.15s ease',
                                                background: isSorted ? 'var(--accent-glow)' : undefined,
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <TypeIcon size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                <span>{col.name}</span>
                                                {isSorted && (
                                                    <ArrowUpDown size={11} style={{
                                                        color: 'var(--accent-primary)',
                                                        transform: sortDirection === 'desc' ? 'scaleY(-1)' : 'none',
                                                    }} />
                                                )}
                                            </div>

                                            {/* Column Stats Tooltip */}
                                            {stats && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    zIndex: 100,
                                                    background: 'var(--bg-elevated)',
                                                    border: '1px solid var(--border-primary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    padding: '0.625rem',
                                                    fontSize: '0.6875rem',
                                                    color: 'var(--text-secondary)',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: 'var(--shadow-lg)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.25rem',
                                                    minWidth: 140,
                                                }}>
                                                    <div><strong>Type:</strong> {stats.type}</div>
                                                    <div><strong>Unique:</strong> {stats.uniqueCount.toLocaleString()}</div>
                                                    <div><strong>Nulls:</strong> {stats.nullCount.toLocaleString()}</div>
                                                    {stats.type === 'number' && stats.stats && (
                                                        <>
                                                            <div><strong>Min:</strong> {stats.stats.min?.toLocaleString()}</div>
                                                            <div><strong>Max:</strong> {stats.stats.max?.toLocaleString()}</div>
                                                            <div><strong>Mean:</strong> {stats.stats.mean?.toFixed(2)}</div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRows.map((row, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                                        {currentPage * pageSize + i + 1}
                                    </td>
                                    {dataset.columns.map((col) => {
                                        const val = row[col.name];
                                        return (
                                            <td key={col.name}>
                                                {val === null || val === undefined
                                                    ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.5 }}>null</span>
                                                    : typeof val === 'number'
                                                        ? val.toLocaleString()
                                                        : String(val)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderTop: '1px solid var(--border-primary)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                    }}>
                        <span>
                            Showing {(currentPage * pageSize + 1).toLocaleString()} – {Math.min((currentPage + 1) * pageSize, filteredAndSortedRows.length).toLocaleString()} of {filteredAndSortedRows.length.toLocaleString()}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                className="btn-icon"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(0)}
                                style={{ opacity: currentPage === 0 ? 0.4 : 1, fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}
                            >
                                First
                            </button>
                            <button
                                className="btn-icon"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(p => p - 1)}
                                style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontWeight: 600, minWidth: 60, textAlign: 'center' }}>
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button
                                className="btn-icon"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(p => p + 1)}
                                style={{ opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button
                                className="btn-icon"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage(totalPages - 1)}
                                style={{ opacity: currentPage >= totalPages - 1 ? 0.4 : 1, fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
