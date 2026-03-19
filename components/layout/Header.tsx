'use client';

import { useDataStore } from '@/hooks/useDataStore';
import { ThemeToggle } from './ThemeToggle';
import {
    Upload,
    LayoutDashboard,
    Sparkles,
    RotateCcw,
    Table2,
} from 'lucide-react';

export function Header() {
    const { state, goToStep, resetAll } = useDataStore();

    const steps = [
        { key: 'upload' as const, label: 'Upload', icon: Upload },
        { key: 'preview' as const, label: 'Preview & Clean', icon: Table2 },
        { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    ];

    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-card)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                height: '64px',
            }}
        >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Sparkles size={16} color="var(--bg-primary)" />
                </div>
                <span
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: 'var(--text-primary)',
                    }}
                >
                    InsightBoard
                </span>
            </div>

            {/* Step Navigation */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {steps.map((step, i) => {
                    const isActive = state.currentStep === step.key;
                    const isAccessible =
                        step.key === 'upload' ||
                        (step.key === 'preview' && state.cleanedDataset) ||
                        (step.key === 'dashboard' && state.dashboardConfig);

                    return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                            {i > 0 && (
                                <div
                                    style={{
                                        width: 32,
                                        height: 1,
                                        background: 'var(--border-primary)',
                                        margin: '0 0.25rem',
                                    }}
                                />
                            )}
                            <button
                                onClick={() => isAccessible && goToStep(step.key)}
                                disabled={!isAccessible}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                                    color: isActive
                                        ? 'var(--accent-primary)'
                                        : isAccessible
                                            ? 'var(--text-secondary)'
                                            : 'var(--text-muted)',
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: '0.8125rem',
                                    cursor: isAccessible ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                    opacity: isAccessible ? 1 : 0.5,
                                }}
                            >
                                <step.icon size={16} />
                                <span style={{ display: 'none' }} className="sm-show">
                                    {step.label}
                                </span>
                                <span>{step.label}</span>
                            </button>
                        </div>
                    );
                })}
            </nav>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {state.currentStep !== 'upload' && (
                    <button
                        className="btn-secondary"
                        onClick={resetAll}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                    >
                        <RotateCcw size={14} />
                        New Data
                    </button>
                )}
                <ThemeToggle />
            </div>
        </header>
    );
}
