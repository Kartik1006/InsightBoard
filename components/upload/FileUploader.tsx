'use client';

import { useCallback, useState, useRef } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { Upload, FileSpreadsheet, FileJson, FileText, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function FileUploader() {
    const { uploadFile, state } = useDataStore();
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            await uploadFile(file);
        },
        [uploadFile]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const onFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    return (
        <div style={{ minHeight: 'calc(100vh - 65px)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
                style={{
                    width: '100%',
                    maxWidth: 1000,
                    margin: '0 auto',
                    padding: '4rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4rem',
                }}
            >
                {/* Hero Title Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center' }}
                >
                    <h1
                        style={{
                            fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.05,
                            background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-primary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '1.5rem',
                        }}
                    >
                        Visualize data.<br />
                        <span style={{ color: 'var(--text-secondary)' }}>Instantly.</span>
                    </h1>
                    <p
                        style={{
                            fontSize: '1.125rem',
                            color: 'var(--text-muted)',
                            maxWidth: 500,
                            margin: '0 auto',
                            lineHeight: 1.6,
                        }}
                    >
                        Drop any CSV or JSON file. Our engine parses your raw data, defines vital metrics, and generates a stunning financial-grade dashboard.
                    </p>
                </motion.div>

                {/* Main Action Area (Upload + Presets) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                        width: '100%',
                        maxWidth: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}
                >
                    {/* Error */}
                    {state.error && (
                        <div
                            style={{
                                background: 'var(--danger-bg)',
                                border: '1px solid var(--danger)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                color: 'var(--danger)',
                                fontSize: '0.875rem',
                                width: '100%',
                                textAlign: 'center',
                            }}
                        >
                            {state.error}
                        </div>
                    )}

                    {/* Upload Zone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        style={{
                            padding: '4rem 2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem',
                            textAlign: 'center',
                            background: isDragging ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                            border: `1px ${isDragging ? 'solid' : 'dashed'} ${isDragging ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,.json,.tsv"
                            onChange={onFileSelect}
                            style={{ display: 'none' }}
                            id="file-upload-main"
                        />

                        {state.isLoading ? (
                            <>
                                <Loader2
                                    size={48}
                                    style={{
                                        color: 'var(--text-primary)',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </>
                        ) : (
                            <>
                                <div
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Upload size={24} style={{ color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <p
                                        style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            marginBottom: '0.25rem',
                                            letterSpacing: '-0.02em'
                                        }}
                                    >
                                        Drop your file here
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        Supports CSV, Excel, and JSON
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Presets Row */}
                    {!state.isLoading && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                            {[
                                { name: 'Sales Pipeline', url: '/sample_sales.csv' },
                                { name: 'Customer Retail', url: '/people-1000.csv' },
                                { name: 'Product Inventory', url: '/products-1000.csv' },
                            ].map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            const res = await fetch(preset.url);
                                            const blob = await res.blob();
                                            const file = new File([blob], preset.url.replace('/', ''), { type: 'text/csv' });
                                            await uploadFile(file);
                                        } catch (err) {
                                            console.error('Failed to load preset:', err);
                                        }
                                    }}
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        transition: 'border-color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-primary)')}
                                >
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Preset
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{preset.name}</span>
                                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
