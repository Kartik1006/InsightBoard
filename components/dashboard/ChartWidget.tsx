'use client';

import { ChartRecommendation } from '@/lib/types';
import { motion } from 'framer-motion';
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
import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

interface ChartWidgetProps {
    chart: ChartRecommendation;
    index: number;
    onRemove?: (id: string) => void;
}

// Carbon-consistent tooltip style — uses CSS overrides for dark mode
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

export function ChartWidget({ chart, index, onRemove }: ChartWidgetProps) {
    const colors = chart.colorScheme;
    const purpose = purposeConfig[chart.purpose] || purposeConfig.comparison;

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
                            {/* Center label */}
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
                // Radar chart — Carbon-inspired circular comparison
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
            // Apply slight timeout to ensure fonts and SVG paths are fully rendered
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

    return (
        <motion.div
            ref={chartRef}
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            style={{ position: 'relative' }}
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
                        onClick={() => onRemove(chart.id)}
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
        </motion.div>
    );
}
