'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { useTheme } from 'next-themes';
import { ChartRecommendation } from '@/lib/types';
import { KPICard } from './KPICard';
import { ChartWidget } from './ChartWidget';
import { FilterPanel } from './FilterPanel';
import { CustomChartBuilder } from './CustomChartBuilder';
import { AIInsightsPanel } from './AIInsightsPanel';
import { NLQueryPanel } from './NLQueryPanel';
import { DataExplorer } from './DataExplorer';

import { motion } from 'framer-motion';
import { BarChart3, FileText, Lightbulb, TrendingUp, AlertTriangle, PieChart, GitBranch, Database, Table2, LayoutDashboard, Download } from 'lucide-react';
import { downloadDatasetAsCSV } from '@/lib/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type DashboardTab = 'dashboard' | 'explorer' | 'sql';

const TAB_CONFIG: { id: DashboardTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'explorer', label: 'Data Explorer', icon: Table2 },
    { id: 'sql', label: 'SQL Query', icon: Database },
];

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

function SortableChartItem({ chart, index, onRemove }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chart.id });
    const span = chart.type === 'pie' || chart.type === 'radar' || chart.type === 'donut' ? 4 : 6;
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.8 : 1,
    };
    const spanClass = chart.type === 'pie' || chart.type === 'radar' || chart.type === 'donut' ? 'chart-grid-sm' : 'chart-grid-lg';

    return (
        <div ref={setNodeRef} style={style} className={spanClass}>
            <div 
                {...attributes} 
                {...listeners} 
                title="Drag to reorder"
                style={{ 
                    position: 'absolute', 
                    top: 10, left: 10, right: 80, height: 40, 
                    cursor: isDragging ? 'grabbing' : 'grab', 
                    zIndex: 20 
                }} 
            />
            <ChartWidget
                chart={chart}
                index={index}
                onRemove={onRemove}
                enableFlip={true}
            />
        </div>
    );
}

export function DashboardView() {
    const { state, updateFilters } = useDataStore();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { dashboardConfig, cleanedDataset } = state;

    const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
    const [hiddenChartIds, setHiddenChartIds] = useState<Set<string>>(new Set());
    const [customCharts, setCustomCharts] = useState<ChartRecommendation[]>([]);

    const [chartOrder, setChartOrder] = useState<string[]>([]);

    useEffect(() => {
        if (dashboardConfig) {
            // Initialize chart order if not fully set
            setChartOrder(prev => {
                const currentIds = dashboardConfig.charts.map(c => c.id);
                if (prev.length === 0) return currentIds;
                const newIds = currentIds.filter(id => !prev.includes(id));
                return [...prev, ...newIds];
            });
        }
    }, [dashboardConfig]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    if (!dashboardConfig || !cleanedDataset) return null;

    const { kpis, charts, filters, insights } = dashboardConfig;
    
    // Sort and filter active charts
    const activeCharts = [...charts, ...customCharts].filter(c => !hiddenChartIds.has(c.id));
    const orderedVisibleCharts = chartOrder
        .map(id => activeCharts.find(c => c.id === id))
        .filter(Boolean) as ChartRecommendation[];
    
    // Add any remaining charts that aren't in the chartOrder array yet (like newly added custom ones)
    const sortedRenderCharts = [
        ...orderedVisibleCharts,
        ...activeCharts.filter(c => !chartOrder.includes(c.id))
    ];

    const handleFiltersChange = (newFilters: typeof filters) => updateFilters(newFilters, isDark);
    const handleRemoveChart = (id: string) => setHiddenChartIds(prev => new Set(prev).add(id));
    const handleAddCustomChart = (chart: ChartRecommendation) => {
        setCustomCharts(prev => [...prev, chart]);
        setChartOrder(prev => [...prev, chart.id]);
    };
    const handleRemoveCustomChart = (id: string) => setCustomCharts(prev => prev.filter(c => c.id !== id));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setChartOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-primary)' }}>

            <FilterPanel filters={filters} onFiltersChange={handleFiltersChange} />

            <main className="dashboard-main" style={{ maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
                {/* File info bar + Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="info-bar-glow dashboard-info-bar"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '1.5rem', padding: '0.625rem 1rem', borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)',
                        flexWrap: 'wrap', gap: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cleanedDataset.fileName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cleanedDataset.rowCount.toLocaleString()} rows × {cleanedDataset.columnCount} columns</span>
                        </div>
                        <button
                            className="btn-icon"
                            onClick={() => downloadDatasetAsCSV(cleanedDataset.columns, cleanedDataset.rows, cleanedDataset.fileName)}
                            title="Download cleaned data as CSV"
                            style={{ padding: '0.375rem' }}
                        >
                            <Download size={14} />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        padding: '0.25rem',
                        background: 'var(--bg-card-hover)',
                        borderRadius: 'var(--radius-full)',
                    }}>
                        {TAB_CONFIG.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        padding: '0.375rem 0.875rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: 'none',
                                        background: isActive ? 'var(--bg-card)' : 'transparent',
                                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                        fontWeight: isActive ? 700 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                                    }}
                                >
                                    <Icon size={13} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Tab Content */}
                {activeTab === 'dashboard' && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* AI & Rule Insights */}
                        <AIInsightsPanel dataset={cleanedDataset} />
                        {insights.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' }}
                            >
                                <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <Lightbulb size={15} style={{ color: '#f1c21b' }} /> Key Insights
                                </h3>
                                <div className="insights-grid" style={{ display: 'grid', gap: '0.5rem' }}>
                                    {insights.map((insight) => {
                                        const Icon = insightIcons[insight.category] || Lightbulb;
                                        const alert = insightAlertStyles[insight.alertLevel] || insightAlertStyles.neutral;
                                        return (
                                            <div
                                                key={insight.id}
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem 0.75rem', background: alert.bg, borderLeft: `3px solid ${alert.border}`, borderRadius: '4px', fontSize: '0.75rem', lineHeight: 1.5, color: 'var(--text-primary)' }}
                                            >
                                                <Icon size={14} style={{ color: alert.color, flexShrink: 0, marginTop: 2 }} />
                                                <span>{insight.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Grid: KPIs */}
                        <div className="kpi-grid" style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            {kpis.map((kpi, i) => (
                                <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="kpi-grid-item">
                                    <KPICard kpi={kpi} index={i} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Grid: Sortable Charts */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={sortedRenderCharts.map(c => c.id)} strategy={rectSortingStrategy}>
                                <div className="chart-grid" style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                    {sortedRenderCharts.map((chart, i) => (
                                        <SortableChartItem 
                                            key={chart.id} 
                                            chart={chart} 
                                            index={i} 
                                            onRemove={chart.isCustom ? handleRemoveCustomChart : handleRemoveChart} 
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <CustomChartBuilder customCharts={customCharts} onAddChart={handleAddCustomChart} onRemoveChart={handleRemoveCustomChart} />

                        {sortedRenderCharts.length === 0 && kpis.length === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                                <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p style={{ fontSize: '1rem', fontWeight: 500 }}>No visualizations available. Try creating a custom chart below.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'explorer' && (
                    <motion.div
                        key="explorer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DataExplorer />
                    </motion.div>
                )}

                {activeTab === 'sql' && (
                    <motion.div
                        key="sql"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <NLQueryPanel />
                    </motion.div>
                )}
            </main>
        </div>
    );
}
