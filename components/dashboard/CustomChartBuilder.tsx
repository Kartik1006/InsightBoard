'use client';

import { useState } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { useTheme } from 'next-themes';
import { ChartType, AggregationType, ChartRecommendation } from '@/lib/types';
import { buildCustomChart } from '@/lib/analyzer';
import { ChartWidget } from './ChartWidget';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    BarChart3,
    PieChart,
    TrendingUp,
    ScatterChart as ScatterIcon,
    Radar,
    Activity,
} from 'lucide-react';

const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'bar', label: 'Bar', icon: BarChart3 },
    { value: 'line', label: 'Line', icon: TrendingUp },
    { value: 'area', label: 'Area', icon: TrendingUp },
    { value: 'donut', label: 'Donut', icon: PieChart },
    { value: 'scatter', label: 'Scatter', icon: ScatterIcon },
    { value: 'radar', label: 'Radar', icon: Radar },
    { value: 'step', label: 'Step', icon: Activity },
];

const AGG_OPTIONS: { value: AggregationType; label: string }[] = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
];

interface CustomChartBuilderProps {
    customCharts: ChartRecommendation[];
    onAddChart: (chart: ChartRecommendation) => void;
    onRemoveChart: (id: string) => void;
}

export function CustomChartBuilder({ customCharts, onAddChart, onRemoveChart }: CustomChartBuilderProps) {
    const { state } = useDataStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isOpen, setIsOpen] = useState(false);
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [xColumn, setXColumn] = useState('');
    const [yColumn, setYColumn] = useState('');
    const [aggregation, setAggregation] = useState<AggregationType>('count');
    const [preview, setPreview] = useState<ChartRecommendation | null>(null);

    const dataset = state.cleanedDataset;
    if (!dataset) return null;

    const columns = dataset.columns;
    const numericColumns = columns.filter((c) => c.type === 'number');

    const handlePreview = () => {
        if (!xColumn) return;
        const chart = buildCustomChart(
            dataset,
            xColumn,
            aggregation === 'count' ? null : yColumn || null,
            chartType,
            aggregation,
            isDark
        );
        setPreview(chart);
    };

    const handleAdd = () => {
        if (preview) {
            onAddChart(preview);
            setPreview(null);
            setIsOpen(false);
            setXColumn('');
            setYColumn('');
            setAggregation('count');
        }
    };

    return (
        <div>
            {/* Custom Charts Grid */}
            {customCharts.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3
                        style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <BarChart3 size={16} style={{ color: 'var(--accent-primary)' }} />
                        Custom Charts
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                            gap: '1.5rem',
                        }}
                    >
                        {customCharts.map((chart, i) => (
                            <ChartWidget
                                key={chart.id}
                                chart={chart}
                                index={i}
                                onRemove={onRemoveChart}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Add Chart Button */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(true)}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'var(--bg-card)',
                    border: '2px dashed var(--border-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                }}
            >
                <Plus size={18} />
                Create Custom Chart
            </motion.button>

            {/* Builder Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem',
                        }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-secondary)',
                                borderRadius: 'var(--radius-xl)',
                                padding: '2rem',
                                width: '100%',
                                maxWidth: preview ? 920 : 520,
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: 'var(--shadow-xl)',
                                transition: 'max-width 0.3s ease',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
                                    Create Custom Chart
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        background: 'var(--bg-card-hover)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        padding: '0.375rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                {/* Form Side */}
                                <div style={{ flex: '1 1 280px', minWidth: 280 }}>
                                    {/* Chart Type Grid */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label
                                            style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                marginBottom: '0.5rem',
                                                display: 'block',
                                            }}
                                        >
                                            Chart Type
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
                                            {CHART_TYPE_OPTIONS.map((opt) => {
                                                const Icon = opt.icon;
                                                const isSelected = chartType === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => { setChartType(opt.value); setPreview(null); }}
                                                        style={{
                                                            padding: '0.5rem 0.375rem',
                                                            borderRadius: '8px',
                                                            border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                                            background: isSelected ? 'var(--accent-glow)' : 'var(--bg-input)',
                                                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '0.2rem',
                                                            fontSize: '0.625rem',
                                                            fontWeight: 600,
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        <Icon size={16} />
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* X-Axis Column */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label
                                            style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                marginBottom: '0.375rem',
                                                display: 'block',
                                            }}
                                        >
                                            X-Axis / Category
                                        </label>
                                        <select
                                            className="filter-select"
                                            value={xColumn}
                                            onChange={(e) => { setXColumn(e.target.value); setPreview(null); }}
                                        >
                                            <option value="">Select column...</option>
                                            {columns.map((col) => (
                                                <option key={col.name} value={col.name}>
                                                    {col.name} ({col.type}, {col.uniqueCount} unique)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Aggregation */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label
                                            style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                marginBottom: '0.375rem',
                                                display: 'block',
                                            }}
                                        >
                                            Aggregation
                                        </label>
                                        <select
                                            className="filter-select"
                                            value={aggregation}
                                            onChange={(e) => { setAggregation(e.target.value as AggregationType); setPreview(null); }}
                                        >
                                            {AGG_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Y-Axis Column (only when not count) */}
                                    {aggregation !== 'count' && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-secondary)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                    marginBottom: '0.375rem',
                                                    display: 'block',
                                                }}
                                            >
                                                Y-Axis / Value (numeric)
                                            </label>
                                            <select
                                                className="filter-select"
                                                value={yColumn}
                                                onChange={(e) => { setYColumn(e.target.value); setPreview(null); }}
                                            >
                                                <option value="">Select column...</option>
                                                {numericColumns.map((col) => (
                                                    <option key={col.name} value={col.name}>{col.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                                        <button
                                            className="btn-secondary"
                                            onClick={handlePreview}
                                            disabled={!xColumn}
                                            style={{ flex: 1, opacity: xColumn ? 1 : 0.5, cursor: xColumn ? 'pointer' : 'not-allowed' }}
                                        >
                                            Preview
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={handleAdd}
                                            disabled={!preview}
                                            style={{ flex: 1, opacity: preview ? 1 : 0.5, cursor: preview ? 'pointer' : 'not-allowed' }}
                                        >
                                            Add to Dashboard
                                        </button>
                                    </div>
                                </div>

                                {/* Preview Side */}
                                {preview && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{ flex: '1 1 350px', minWidth: 350 }}
                                    >
                                        <label
                                            style={{
                                                fontSize: '0.6875rem',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                marginBottom: '0.75rem',
                                                display: 'block',
                                            }}
                                        >
                                            Preview
                                        </label>
                                        <ChartWidget chart={preview} index={0} />
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
