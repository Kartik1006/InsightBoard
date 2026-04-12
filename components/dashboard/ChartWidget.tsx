'use client';

import { ChartRecommendation } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { useRef, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import {
    Download,
    Sparkles,
    Loader2,
    RotateCcw,
    TrendingUp,
    AlertTriangle,
    PieChart as PieChartIcon,
    GitBranch,
    Lightbulb,
} from 'lucide-react';

interface CardInsight {
    text: string;
    category: 'trend' | 'outlier' | 'distribution' | 'correlation';
    alertLevel: 'success' | 'warning' | 'danger' | 'neutral';
}

interface ChartWidgetProps {
    chart: ChartRecommendation;
    index: number;
    onRemove?: (id: string) => void;
    enableFlip?: boolean;
}

// Carbon-consistent tooltip style
const tooltipStyle = {
    borderRadius: '6px',
    fontSize: '0.8125rem',
    padding: '8px 12px',
};

// Purpose badge colors (Carbon-inspired)
const purposeConfig: Record<string, { label: string; color: string }> = {
    comparison: { label: 'Comparison', color: '#6929c4' },
    trend: { label: 'Trend', color: '#1192e8' },
    'part-to-whole': { label: 'Part-to-Whole', color: '#009d9a' },
    correlation: { label: 'Correlation', color: '#9f1853' },
};

const insightIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    trend: TrendingUp,
    outlier: AlertTriangle,
    distribution: PieChartIcon,
    correlation: GitBranch,
};

const alertStyles: Record<string, { bg: string; border: string; color: string }> = {
    success: { bg: 'var(--success-bg)', border: 'var(--success)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--warning)' },
    danger: { bg: 'var(--danger-bg)', border: 'var(--danger)', color: 'var(--danger)' },
    neutral: { bg: 'var(--bg-card-hover)', border: 'var(--border-secondary)', color: 'var(--text-secondary)' },
};

export function ChartWidget({ chart, index, onRemove, enableFlip = true }: ChartWidgetProps) {
    const colors = chart.colorScheme;
    const purpose = purposeConfig[chart.purpose] || purposeConfig.comparison;
    const [isFlipped, setIsFlipped] = useState(false);
    const [cardInsights, setCardInsights] = useState<CardInsight[]>([]);
    const [insightLoading, setInsightLoading] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);

    const fetchCardInsight = useCallback(async () => {
        if (cardInsights.length > 0) return; // Already fetched
        setInsightLoading(true);
        setInsightError(null);
        try {
            // Build a concise summary of this specific chart's data
            const chartSummary = [
                `Chart: "${chart.title}" (${chart.type})`,
                `Purpose: ${chart.purpose}`,
                chart.description ? `Description: ${chart.description}` : '',
                `X-Axis: ${chart.xAxis}${chart.yAxis ? `, Y-Axis: ${chart.yAxis}` : ''}`,
                `Data points: ${chart.data.length}`,
                `Sample data: ${JSON.stringify(chart.data.slice(0, 5))}`,
            ].filter(Boolean).join('\n');

            const response = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataSummary: chartSummary }),
            });
            const data = await response.json();
            if (data.insights && data.insights.length > 0) {
                setCardInsights(data.insights);
            } else {
                setInsightError('No insights available for this chart.');
            }
        } catch {
            setInsightError('Failed to load insights.');
        } finally {
            setInsightLoading(false);
        }
    }, [chart, cardInsights.length]);

    const handleFlip = useCallback((e: React.MouseEvent) => {
        // Don't flip if clicking controls
        if ((e.target as HTMLElement).closest('.chart-controls')) return;
        if (!enableFlip) return;
        const nextFlipped = !isFlipped;
        setIsFlipped(nextFlipped);
        if (nextFlipped) {
            fetchCardInsight();
        }
    }, [isFlipped, enableFlip, fetchCardInsight]);

    const renderChart = () => {
        switch (chart.type) {
            case 'bar':
            case 'histogram':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={chart.data}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-primary)"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey={chart.xAxis}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--border-primary)' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={false}
                            />
                            <Bar
                                dataKey={chart.yAxis || 'Count'}
                                radius={[3, 3, 0, 0]}
                                animationDuration={800}
                            >
                                {chart.data.map((_, i) => (
                                    <Cell key={i} fill={colors[i % colors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chart.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-primary)"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey={chart.xAxis}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--border-primary)' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={{ stroke: 'var(--border-secondary)', strokeDasharray: '4 4' }}
                            />
                            <Line
                                type="monotone"
                                dataKey={chart.yAxis || 'value'}
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={{ r: 3, fill: colors[0], strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-card)' }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chart.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id={`gradient-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={colors[0]} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={colors[0]} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-primary)"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey={chart.xAxis}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--border-primary)' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={{ stroke: 'var(--border-secondary)', strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={chart.yAxis || 'value'}
                                stroke={colors[0]}
                                strokeWidth={2}
                                fill={`url(#gradient-${chart.id})`}
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
            case 'donut': {
                const total = chart.data.reduce(
                    (sum, entry) => sum + (Number(entry.value) || 0),
                    0
                );
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={chart.data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={110}
                                innerRadius={65}
                                paddingAngle={2}
                                animationDuration={800}
                                strokeWidth={0}
                            >
                                {chart.data.map((_, i) => (
                                    <Cell key={i} fill={colors[i % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: unknown, name: unknown) => {
                                    const numVal = Number(value) || 0;
                                    const pct = total > 0 ? ((numVal / total) * 100).toFixed(1) : '0';
                                    return [`${numVal.toLocaleString()} (${pct}%)`, String(name)];
                                }}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{
                                    fontSize: '0.75rem',
                                    paddingTop: '12px',
                                }}
                            />
                            <text
                                x="50%"
                                y="46%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fill: 'var(--text-primary)',
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                }}
                            >
                                {total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total.toLocaleString()}
                            </text>
                            <text
                                x="50%"
                                y="55%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fill: 'var(--text-muted)',
                                    fontSize: '0.6875rem',
                                    fontWeight: 500,
                                }}
                            >
                                Total
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                );
            }

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-primary)"
                                opacity={0.3}
                            />
                            <XAxis
                                dataKey={chart.xAxis}
                                type="number"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--border-primary)' }}
                                tickLine={false}
                                name={chart.xAxis}
                            />
                            <YAxis
                                dataKey={chart.yAxis || 'value'}
                                type="number"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                name={chart.yAxis || 'value'}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={{ stroke: 'var(--border-secondary)', strokeDasharray: '4 4' }}
                            />
                            <Scatter
                                data={chart.data}
                                fill={colors[0]}
                                fillOpacity={0.7}
                                animationDuration={800}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'radar': {
                return (
                    <ResponsiveContainer width="100%" height={320}>
                        <RadarChart data={chart.data} cx="50%" cy="50%" outerRadius="70%">
                            <PolarGrid stroke="var(--border-primary)" />
                            <PolarAngleAxis
                                dataKey={chart.xAxis}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                            />
                            <PolarRadiusAxis
                                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                axisLine={false}
                            />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Radar
                                dataKey={chart.yAxis || 'Count'}
                                stroke={colors[0]}
                                fill={colors[0]}
                                fillOpacity={0.25}
                                strokeWidth={2}
                                animationDuration={800}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            }

            case 'step':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chart.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-primary)"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey={chart.xAxis}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={{ stroke: 'var(--border-primary)' }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                cursor={{ stroke: 'var(--border-secondary)', strokeDasharray: '4 4' }}
                            />
                            <Line
                                type="stepAfter"
                                dataKey={chart.yAxis || 'Count'}
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={{ r: 3, fill: colors[0], strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-card)' }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            default:
                return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Unsupported chart type</div>;
        }
    };
    
    const chartRef = useRef<HTMLDivElement>(null);

    const handleDownload = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!chartRef.current) return;
        try {
            const canvas = await html2canvas(chartRef.current, {
                backgroundColor: '#000000',
                scale: 2,
                logging: false,
                ignoreElements: (element) => element.classList.contains('chart-controls'),
            });
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${chart.title.replace(/\s+/g, '_').toLowerCase()}.png`;
            link.href = url;
            link.click();
        } catch (error) {
            console.error('Failed to download chart:', error);
        }
    }, [chart.title]);

    // --- Back face: insights ---
    const renderBackFace = () => (
        <div
            className="chart-container card-back-content"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 380,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: 0,
                }}>
                    <Sparkles size={16} className="sparkle-icon" style={{ color: '#a78bfa' }} />
                    AI Insights
                    <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                    }}>
                        for &ldquo;{chart.title}&rdquo;
                    </span>
                </h4>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                    className="btn-icon"
                    title="Flip back"
                    style={{ padding: '0.375rem' }}
                >
                    <RotateCcw size={14} />
                </button>
            </div>

            {/* Loading */}
            {insightLoading && (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    color: 'var(--text-muted)',
                }}>
                    <Loader2 size={24} className="spin-icon" style={{ color: '#a78bfa' }} />
                    <span style={{ fontSize: '0.8125rem' }}>Analyzing chart data…</span>
                </div>
            )}

            {/* Error */}
            {insightError && (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8125rem',
                    color: 'var(--danger)',
                }}>
                    {insightError}
                </div>
            )}

            {/* Insights list */}
            {!insightLoading && cardInsights.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                    {cardInsights.map((insight, i) => {
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
                </div>
            )}
        </div>
    );

    return (
        <div className="card-flip-wrapper" onClick={handleFlip}>
            <motion.div
                className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
            >
                {/* Front Face */}
                <div className="card-front" ref={chartRef}>
                    <div
                        className="chart-container"
                        style={{ position: 'relative', height: '100%' }}
                    >
                        {/* Top Right Controls */}
                        <div className="chart-controls" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleDownload}
                                title="Download chart as PNG"
                                style={{
                                    background: 'var(--bg-card-hover)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.375rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
                            >
                                <Download size={14} />
                            </button>
                            {onRemove && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(chart.id); }}
                                    title="Remove chart"
                                    style={{
                                        background: 'var(--bg-card-hover)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.375rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Chart header */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem', paddingRight: onRemove ? '2rem' : 0 }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {purpose.label}
                            </span>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                {chart.title}
                            </h4>
                            {chart.description && (
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem', lineHeight: 1.4 }}>
                                    {chart.description}
                                </p>
                            )}
                        </div>

                        {renderChart()}

                        {/* Flip hint */}
                        {enableFlip && (
                            <div
                                className="flip-hint"
                                style={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-primary)',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.625rem',
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    pointerEvents: 'none',
                                }}
                            >
                                <Sparkles size={10} />
                                Click for AI insights
                            </div>
                        )}
                    </div>
                </div>

                {/* Back Face */}
                <div className="card-back">
                    {renderBackFace()}
                </div>
            </motion.div>
        </div>
    );
}
