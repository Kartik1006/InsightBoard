'use client';

import { useState } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { useTheme } from 'next-themes';
import { ChartType, AggregationType, SortMode, ChartRecommendation } from '@/lib/types';
import { buildAdvancedCustomChart } from '@/lib/analyzer';
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
    Layers,
    ArrowUpDown,
    Hash,
    SlidersHorizontal,
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

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'none', label: 'No sorting' },
    { value: 'value-desc', label: 'Value (High → Low)' },
    { value: 'value-asc', label: 'Value (Low → High)' },
    { value: 'alpha-asc', label: 'Alphabetical (A → Z)' },
    { value: 'alpha-desc', label: 'Alphabetical (Z → A)' },
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
    const [yColumns, setYColumns] = useState<string[]>([]);
    const [groupByColumn, setGroupByColumn] = useState('');
    const [aggregation, setAggregation] = useState<AggregationType>('count');
    const [sortMode, setSortMode] = useState<SortMode>('value-desc');
    const [topN, setTopN] = useState(15);
    const [stacked, setStacked] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [preview, setPreview] = useState<ChartRecommendation | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const dataset = state.cleanedDataset;
    if (!dataset) return null;

    const columns = dataset.columns;
    const numericColumns = columns.filter((c) => c.type === 'number');
    const categoricalColumns = columns.filter((c) => c.type === 'string' || c.type === 'boolean');

    const handleToggleYColumn = (colName: string) => {
        setYColumns(prev => {
            if (prev.includes(colName)) {
                return prev.filter(c => c !== colName);
            }
            return [...prev, colName];
        });
        setPreview(null);
    };

    const handlePreview = () => {
        if (!xColumn) return;
        const chart = buildAdvancedCustomChart(
            dataset,
            xColumn,
            yColumns,
            groupByColumn || null,
            chartType,
            aggregation,
            sortMode,
            topN,
            stacked,
            customTitle || null,
            isDark
        );
        setPreview(chart);
    };

    const handleAdd = () => {
        if (preview) {
            onAddChart(preview);
            handleReset();
        }
    };

    const handleReset = () => {
        setPreview(null);
        setIsOpen(false);
        setXColumn('');
        setYColumns([]);
        setGroupByColumn('');
        setAggregation('count');
        setSortMode('value-desc');
        setTopN(15);
        setStacked(false);
        setCustomTitle('');
        setShowAdvanced(false);
    };

    const selectStyle = {
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.8125rem',
        width: '100%',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        outline: 'none',
        WebkitAppearance: 'none' as const,
        appearance: 'none' as const,
    };

    const labelStyle = {
        fontSize: '0.6875rem',
        fontWeight: 600 as const,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        marginBottom: '0.375rem',
        display: 'block' as const,
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
                        onClick={() => handleReset()}
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
                                padding: '1.5rem',
                                width: '100%',
                                maxWidth: preview ? 1000 : 560,
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: 'var(--shadow-xl)',
                                transition: 'max-width 0.3s ease',
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                    <SlidersHorizontal size={20} style={{ color: 'var(--accent-primary)' }} />
                                    Chart Builder
                                    <span style={{
                                        fontSize: '0.5625rem',
                                        fontWeight: 600,
                                        color: 'var(--accent-primary)',
                                        background: 'var(--accent-glow)',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: 'var(--radius-full)',
                                        textTransform: 'uppercase',
                                    }}>
                                        Advanced
                                    </span>
                                </h3>
                                <button
                                    onClick={handleReset}
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
                                <div style={{ flex: '1 1 300px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                    {/* Custom Title */}
                                    <div>
                                        <label style={labelStyle}>Chart Title (optional)</label>
                                        <input
                                            type="text"
                                            value={customTitle}
                                            onChange={(e) => { setCustomTitle(e.target.value); setPreview(null); }}
                                            placeholder="Auto-generated if empty"
                                            style={{
                                                ...selectStyle,
                                                cursor: 'text',
                                            }}
                                        />
                                    </div>

                                    {/* Chart Type Grid */}
                                    <div>
                                        <label style={labelStyle}>Chart Type</label>
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
                                    <div>
                                        <label style={labelStyle}>X-Axis / Category</label>
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
                                    <div>
                                        <label style={labelStyle}>Aggregation</label>
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

                                    {/* Y-Axis / Value Columns (multi-select) */}
                                    {aggregation !== 'count' && (
                                        <div>
                                            <label style={labelStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <Hash size={11} />
                                                    Value Columns (select 1 or more)
                                                </div>
                                            </label>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.375rem',
                                                padding: '0.5rem',
                                                background: 'var(--bg-input)',
                                                border: '1px solid var(--border-primary)',
                                                borderRadius: 'var(--radius-sm)',
                                                maxHeight: 140,
                                                overflowY: 'auto',
                                            }}>
                                                {numericColumns.map((col) => {
                                                    const isSelected = yColumns.includes(col.name);
                                                    return (
                                                        <button
                                                            key={col.name}
                                                            onClick={() => handleToggleYColumn(col.name)}
                                                            style={{
                                                                padding: '0.25rem 0.625rem',
                                                                borderRadius: 'var(--radius-full)',
                                                                border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                                                background: isSelected ? 'var(--accent-glow)' : 'transparent',
                                                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                transition: 'all 0.15s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem',
                                                            }}
                                                        >
                                                            {isSelected && <span style={{ color: 'var(--accent-primary)' }}>✓</span>}
                                                            {col.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {yColumns.length > 0 && (
                                                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                    {yColumns.length} column{yColumns.length > 1 ? 's' : ''} selected → multi-series chart
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Group-by / Color-by */}
                                    <div>
                                        <label style={labelStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <Layers size={11} />
                                                Group By / Color By (optional)
                                            </div>
                                        </label>
                                        <select
                                            className="filter-select"
                                            value={groupByColumn}
                                            onChange={(e) => { setGroupByColumn(e.target.value); setPreview(null); }}
                                        >
                                            <option value="">No grouping</option>
                                            {categoricalColumns.filter(c => c.name !== xColumn).map((col) => (
                                                <option key={col.name} value={col.name}>
                                                    {col.name} ({col.uniqueCount} groups)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Advanced Options Toggle */}
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            padding: '0.375rem 0',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <ArrowUpDown size={11} />
                                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                                    </button>

                                    {/* Advanced Options */}
                                    <AnimatePresence>
                                        {showAdvanced && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                                            >
                                                {/* Sort */}
                                                <div>
                                                    <label style={labelStyle}>Sort</label>
                                                    <select
                                                        className="filter-select"
                                                        value={sortMode}
                                                        onChange={(e) => { setSortMode(e.target.value as SortMode); setPreview(null); }}
                                                    >
                                                        {SORT_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Top-N */}
                                                <div>
                                                    <label style={labelStyle}>
                                                        Show Top N Results: {topN === 0 ? 'All' : topN}
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={50}
                                                        step={5}
                                                        value={topN}
                                                        onChange={(e) => { setTopN(Number(e.target.value)); setPreview(null); }}
                                                        style={{ width: '100%', cursor: 'pointer' }}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                                                        <span>All</span>
                                                        <span>50</span>
                                                    </div>
                                                </div>

                                                {/* Stacked Toggle */}
                                                {(chartType === 'bar' || chartType === 'area') && (groupByColumn || yColumns.length > 1) && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <label style={{ ...labelStyle, marginBottom: 0 }}>Stacked</label>
                                                        <button
                                                            onClick={() => { setStacked(!stacked); setPreview(null); }}
                                                            style={{
                                                                width: 36,
                                                                height: 20,
                                                                borderRadius: 10,
                                                                border: 'none',
                                                                background: stacked ? 'var(--accent-primary)' : 'var(--border-secondary)',
                                                                cursor: 'pointer',
                                                                position: 'relative',
                                                                transition: 'background 0.2s ease',
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: '50%',
                                                                background: 'white',
                                                                position: 'absolute',
                                                                top: 2,
                                                                left: stacked ? 18 : 2,
                                                                transition: 'left 0.2s ease',
                                                            }} />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
                                        style={{ flex: '1 1 380px', minWidth: 380 }}
                                    >
                                        <label style={labelStyle}>Preview</label>
                                        <ChartWidget chart={preview} index={0} enableFlip={false} />
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
