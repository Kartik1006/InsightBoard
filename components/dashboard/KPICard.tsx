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
            className="kpi-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {kpi.label}
                </span>
                {kpi.change !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: alertBg, color: alertColor, fontSize: '0.75rem', fontWeight: 600 }}>
                        {kpi.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {kpi.changeLabel}
                    </div>
                )}
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {kpi.formattedValue}
            </div>
        </motion.div>
    );
}
