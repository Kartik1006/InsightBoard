'use client';

import { ChartRecommendation } from '@/lib/types';
import { ChartWidget } from './ChartWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';

interface ChartZoomProps {
    chart: ChartRecommendation | null;
    onClose: () => void;
}

export function ChartZoom({ chart, onClose }: ChartZoomProps) {
    return (
        <AnimatePresence>
            {chart && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        cursor: 'zoom-out',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: 40 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '90vw',
                            maxWidth: 1000,
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            cursor: 'default',
                            position: 'relative',
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 10,
                                background: 'var(--bg-card-hover)',
                                border: '1px solid var(--border-secondary)',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--border-secondary)';
                            }}
                        >
                            <X size={16} />
                        </button>

                        {/* Zoomed chart — renders at larger size */}
                        <div className="chart-zoomed">
                            <ChartWidget chart={{ ...chart, id: `zoom-${chart.id}` }} index={0} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Wrapper for making chart containers clickable
interface ZoomTriggerProps {
    children: React.ReactNode;
    onZoom: () => void;
}

export function ZoomTrigger({ children, onZoom }: ZoomTriggerProps) {
    return (
        <div
            style={{ position: 'relative', cursor: 'zoom-in' }}
            onClick={onZoom}
        >
            {children}
            <div
                className="zoom-hint"
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
                <Maximize2 size={10} />
                Click to zoom
            </div>
        </div>
    );
}
