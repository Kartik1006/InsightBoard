'use client';

import { KPI as KPIType } from '@/lib/types';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Activity,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Activity,
};

interface KPICardProps {
    kpi: KPIType;
    index: number;
}

export function KPICard({ kpi, index }: KPICardProps) {
    const Icon = ICON_MAP[kpi.icon] || Activity;

    const alertColorMap: Record<string, string> = {
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        neutral: 'var(--text-muted)',
    };

    const alertBgMap: Record<string, string> = {
        success: 'var(--success-bg)',
        warning: 'var(--warning-bg)',
        danger: 'var(--danger-bg)',
        neutral: 'rgba(107, 114, 128, 0.1)',
    };

    const alertColor = alertColorMap[kpi.alertLevel] || 'var(--text-muted)';
    const alertBg = alertBgMap[kpi.alertLevel] || 'transparent';

    return (
        <motion.div
            className={`kpi-card alert-${kpi.alertLevel}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                }}
            >
                <span
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    {kpi.label}
                </span>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: alertBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon size={16} style={{ color: alertColor }} />
                </div>
            </div>

            <div
                style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    marginBottom: '0.5rem',
                    lineHeight: 1,
                }}
            >
                {kpi.formattedValue}
            </div>

            {kpi.change !== undefined && (
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: alertBg,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: alertColor,
                    }}
                >
                    {kpi.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.changeLabel}
                </div>
            )}
        </motion.div>
    );
}
