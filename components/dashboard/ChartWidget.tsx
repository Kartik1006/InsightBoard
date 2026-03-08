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

    return (
        <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            {/* Remove button */}
            {onRemove && (
                <button
                    onClick={() => onRemove(chart.id)}
                    title="Remove chart"
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        opacity: 0.6,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.color = 'var(--danger)';
                        e.currentTarget.style.borderColor = 'var(--danger)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'var(--border-primary)';
                    }}
                >
                    ✕
                </button>
            )}

            {/* Chart header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    paddingRight: onRemove ? '2rem' : 0,
                }}
            >
                <h4
                    style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: 0,
                    }}
                >
                    <span
                        style={{
                            width: 3,
                            height: 16,
                            borderRadius: 2,
                            background: purpose.color,
                            display: 'inline-block',
                        }}
                    />
                    {chart.title}
                </h4>
                <span
                    style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: purpose.color,
                        background: `${purpose.color}15`,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                    }}
                >
                    {purpose.label}
                </span>
            </div>

            {/* Chart description */}
            {chart.description && (
                <p
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.75rem',
                        lineHeight: 1.5,
                    }}
                >
                    {chart.description}
                </p>
            )}

            {renderChart()}
        </motion.div>
    );
}
