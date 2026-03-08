'use client';

import { useState } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { useTheme } from 'next-themes';
import { ChartRecommendation } from '@/lib/types';
import { KPICard } from './KPICard';
import { ChartWidget } from './ChartWidget';
import { FilterPanel } from './FilterPanel';
import { CustomChartBuilder } from './CustomChartBuilder';
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

    // Charts the user has hidden
    const [hiddenChartIds, setHiddenChartIds] = useState<Set<string>>(new Set());
    // Custom user-created charts
    const [customCharts, setCustomCharts] = useState<ChartRecommendation[]>([]);

    if (!dashboardConfig || !cleanedDataset) return null;

    const { kpis, charts, filters, insights } = dashboardConfig;

    // Filter out hidden auto-generated charts
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
            {/* Sidebar — Filters */}
            <aside>
                <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />
            </aside>

            {/* Main Content */}
            <main>
                {/* File info bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
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
                        <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cleanedDataset.fileName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {cleanedDataset.rowCount.toLocaleString()} rows × {cleanedDataset.columnCount} columns
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {visibleCharts.length + customCharts.length} charts · {kpis.length} KPIs
                        </span>
                    </div>
                </motion.div>

                {/* Data Insights Panel */}
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
                                    <div
                                        key={insight.id}
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
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* KPI Cards */}
                {kpis.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
                            gap: '1rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        {kpis.map((kpi, i) => (
                            <KPICard key={kpi.id} kpi={kpi} index={i} />
                        ))}
                    </div>
                )}

                {/* Auto-Generated Charts — removable */}
                {visibleCharts.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '1.5rem',
                        }}
                    >
                        {visibleCharts.map((chart, i) => (
                            <ChartWidget
                                key={chart.id}
                                chart={chart}
                                index={i}
                                onRemove={handleRemoveAutoChart}
                            />
                        ))}
                    </div>
                )}

                {/* Custom Charts + Builder */}
                <CustomChartBuilder
                    customCharts={customCharts}
                    onAddChart={handleAddCustomChart}
                    onRemoveChart={handleRemoveCustomChart}
                />

                {/* Empty state */}
                {visibleCharts.length === 0 && kpis.length === 0 && customCharts.length === 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4rem 2rem',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ fontSize: '1rem', fontWeight: 500 }}>
                            No visualizations available. Try creating a custom chart below.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
