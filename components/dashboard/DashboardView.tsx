'use client';

import { useState, useCallback } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { useTheme } from 'next-themes';
import { ChartRecommendation } from '@/lib/types';
import { KPICard } from './KPICard';
import { ChartWidget } from './ChartWidget';
import { FilterPanel } from './FilterPanel';
import { CustomChartBuilder } from './CustomChartBuilder';
import { AIInsightsPanel } from './AIInsightsPanel';
import { ChartZoom, ZoomTrigger } from './ChartZoom';
import { motion } from 'framer-motion';
import {
    BarChart3,
    FileText,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    PieChart,
    GitBranch,
} from 'lucide-react';

// Stagger animation container
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 200 } },
};

// Insight category icon mapping
const insightIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    trend: TrendingUp,
    outlier: AlertTriangle,
    distribution: PieChart,
    correlation: GitBranch,
};

const insightAlertStyles: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: 'var(--success-bg)', border: 'var(--success)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--warning)' },
    danger: { bg: 'var(--danger-bg)', border: 'var(--danger)', color: 'var(--danger)' },
    neutral: { bg: 'var(--bg-card-hover)', border: 'var(--border-secondary)', color: 'var(--text-secondary)' },
};

export function DashboardView() {
    const { state, updateFilters } = useDataStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { dashboardConfig, cleanedDataset } = state;

    const [hiddenChartIds, setHiddenChartIds] = useState<Set<string>>(new Set());
    const [customCharts, setCustomCharts] = useState<ChartRecommendation[]>([]);
    const [zoomedChart, setZoomedChart] = useState<ChartRecommendation | null>(null);

    if (!dashboardConfig || !cleanedDataset) return null;

    const { kpis, charts, filters, insights } = dashboardConfig;
    const visibleCharts = charts.filter((c) => !hiddenChartIds.has(c.id));

    const handleFiltersChange = (newFilters: typeof filters) => {
        updateFilters(newFilters, isDark);
    };

    const handleRemoveAutoChart = (id: string) => {
        setHiddenChartIds((prev) => new Set(prev).add(id));
    };

    const handleAddCustomChart = (chart: ChartRecommendation) => {
        setCustomCharts((prev) => [...prev, chart]);
    };

    const handleRemoveCustomChart = (id: string) => {
        setCustomCharts((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '1.5rem',
                padding: '1.5rem 2rem',
                minHeight: 'calc(100vh - 65px)',
            }}
        >
            {/* Chart Zoom Overlay */}
            <ChartZoom chart={zoomedChart} onClose={() => setZoomedChart(null)} />

            {/* Sidebar — Filters */}
            <aside>
                <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />
            </aside>

            {/* Main Content */}
            <main>
                {/* File info bar — with subtle entrance */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="info-bar-glow"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                        >
                            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                        </motion.div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cleanedDataset.fileName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {cleanedDataset.rowCount.toLocaleString()} rows × {cleanedDataset.columnCount} columns
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <BarChart3 size={14} style={{ color: 'var(--accent-primary)' }} />
                        </motion.div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {visibleCharts.length + customCharts.length} charts · {kpis.length} KPIs
                        </span>
                    </div>
                </motion.div>

                {/* AI Insights Panel — Gemini powered */}
                <AIInsightsPanel dataset={cleanedDataset} />

                {/* Data Insights Panel (rule-based) */}
                {insights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            marginBottom: '1.5rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1rem 1.25rem',
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
                                marginBottom: '0.75rem',
                            }}
                        >
                            <Lightbulb size={15} style={{ color: '#f1c21b' }} />
                            Key Insights
                        </h3>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '0.5rem',
                            }}
                        >
                            {insights.map((insight) => {
                                const Icon = insightIcons[insight.category] || Lightbulb;
                                const alert = insightAlertStyles[insight.alertLevel] || insightAlertStyles.neutral;
                                return (
                                    <motion.div
                                        key={insight.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 }}
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
                        </div>
                    </motion.div>
                )}

                {/* KPI Cards — staggered entrance */}
                {kpis.length > 0 && (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
                            gap: '1rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        {kpis.map((kpi, i) => (
                            <motion.div key={kpi.id} variants={staggerItem}>
                                <KPICard kpi={kpi} index={i} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Auto-Generated Charts — removable + zoomable */}
                {visibleCharts.length > 0 && (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        {visibleCharts.map((chart, i) => (
                            <motion.div key={chart.id} variants={staggerItem}>
                                <ZoomTrigger onZoom={() => setZoomedChart(chart)}>
                                    <ChartWidget
                                        chart={chart}
                                        index={i}
                                        onRemove={(id) => {
                                            // Prevent zoom when clicking remove
                                            setHiddenChartIds((prev) => new Set(prev).add(id));
                                        }}
                                    />
                                </ZoomTrigger>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Custom Charts + Builder */}
                <CustomChartBuilder
                    customCharts={customCharts}
                    onAddChart={handleAddCustomChart}
                    onRemoveChart={handleRemoveCustomChart}
                />

                {/* Empty state */}
                {visibleCharts.length === 0 && kpis.length === 0 && customCharts.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4rem 2rem',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        </motion.div>
                        <p style={{ fontSize: '1rem', fontWeight: 500 }}>
                            No visualizations available. Try creating a custom chart below.
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
