'use client';

import { useDataStore } from '@/hooks/useDataStore';
import { useTheme } from 'next-themes';
import { CLEANING_ACTIONS } from '@/lib/cleaner';
import { motion } from 'framer-motion';
import {
    Undo2,
    Sparkles,
    Trash2,
    CopyMinus,
    Calculator,
    BarChart3,
    Hash,
    Type,
    TrendingUp,
    Columns3 as Columns,
    Scissors,
    Calendar,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    Info,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
    CopyMinus,
    Trash2,
    Calculator,
    BarChart3,
    Hash,
    Type,
    TrendingUp,
    Columns,
    Scissors,
    Calendar,
};

export function CleaningPanel() {
    const { state, applyCleaning, undoCleaning, generateDashboard } = useDataStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { cleanedDataset, lastCleaningResult, cleaningHistory } = state;

    if (!cleanedDataset) return null;

    // Compute data quality
    const totalCells = cleanedDataset.rowCount * cleanedDataset.columnCount;
    const nullCells = cleanedDataset.columns.reduce((s, c) => s + c.nullCount, 0);
    const quality = totalCells > 0 ? ((totalCells - nullCells) / totalCells) * 100 : 100;

    return (
        <div style={{ padding: '1.5rem 2rem' }}>
            {/* Data Quality Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Data Quality Score
                        </span>
                        <span
                            style={{
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                color:
                                    quality >= 90
                                        ? 'var(--success)'
                                        : quality >= 70
                                            ? 'var(--warning)'
                                            : 'var(--danger)',
                            }}
                        >
                            {quality.toFixed(1)}%
                        </span>
                    </div>
                    <div
                        style={{
                            height: 8,
                            borderRadius: 4,
                            background: 'var(--bg-input)',
                            overflow: 'hidden',
                        }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quality}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                                height: '100%',
                                borderRadius: 4,
                                background:
                                    quality >= 90
                                        ? 'var(--success)'
                                        : quality >= 70
                                            ? 'var(--warning)'
                                            : 'var(--danger)',
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Rows: </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cleanedDataset.rowCount.toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Columns: </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cleanedDataset.columnCount}
                        </span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Missing: </span>
                        <span style={{ fontWeight: 600, color: nullCells > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            {nullCells.toLocaleString()}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Last cleaning result */}
            {lastCleaningResult && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'var(--success-bg)',
                        border: '1px solid var(--success)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1.25rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.8125rem',
                    }}
                >
                    <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)' }}>
                        <strong>{lastCleaningResult.actionApplied}</strong>
                        {lastCleaningResult.rowsAffected > 0 &&
                            ` — ${lastCleaningResult.rowsAffected} rows affected`}
                        {lastCleaningResult.columnsAffected > 0 &&
                            ` — ${lastCleaningResult.columnsAffected} columns affected`}
                    </span>
                </motion.div>
            )}

            {/* Cleaning Actions Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '0.9375rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
                        Data Cleaning Actions
                    </h3>
                    {cleaningHistory.length > 0 && (
                        <button className="btn-secondary" onClick={undoCleaning} style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
                            <Undo2 size={14} />
                            Undo
                        </button>
                    )}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '0.75rem',
                    }}
                >
                    {CLEANING_ACTIONS.map((action) => {
                        const Icon = ICON_MAP[action.icon] || Info;
                        return (
                            <motion.button
                                key={action.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => applyCleaning(action.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    background: 'var(--bg-card)',
                                    border: `1px solid ${action.isDestructive
                                        ? 'rgba(239,68,68,0.2)'
                                        : 'var(--border-primary)'
                                        }`,
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease',
                                    width: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 'var(--radius-sm)',
                                        background: action.isDestructive
                                            ? 'var(--danger-bg)'
                                            : 'var(--accent-glow)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon
                                        size={16}
                                    />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            marginBottom: '0.125rem',
                                        }}
                                    >
                                        {action.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.6875rem',
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {action.description}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Generate Dashboard CTA */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '1rem',
                }}
            >
                <button
                    className="btn-primary"
                    onClick={() => generateDashboard(isDark)}
                    style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}
                >
                    <Sparkles size={18} />
                    Generate Dashboard
                    <ArrowRight size={18} />
                </button>
            </motion.div>
        </div>
    );
}
