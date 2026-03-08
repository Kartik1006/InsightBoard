'use client';

import { useCallback, useState, useRef } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { Upload, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react';
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

    const supportedFormats = [
        { ext: 'CSV', icon: FileText, color: '#22c55e' },
        { ext: 'Excel', icon: FileSpreadsheet, color: '#6366f1' },
        { ext: 'JSON', icon: FileJson, color: '#f59e0b' },
    ];

    return (
        <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 65px)' }}>
            <div
                style={{
                    maxWidth: 700,
                    margin: '0 auto',
                    padding: '6rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2rem',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center' }}
                >
                    <h1
                        style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1.2,
                            marginBottom: '0.75rem',
                            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Turn Raw Data Into
                        <br />
                        Beautiful Dashboards
                    </h1>
                    <p
                        style={{
                            fontSize: '1.125rem',
                            color: 'var(--text-secondary)',
                            maxWidth: 480,
                            margin: '0 auto',
                            lineHeight: 1.6,
                        }}
                    >
                        Upload your data file and we&apos;ll auto-generate interactive
                        visualizations, KPIs, and insights — no coding required.
                    </p>
                </motion.div>

                {/* Upload Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ width: '100%' }}
                >
                    <div
                        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        style={{
                            padding: '3.5rem 2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.25rem',
                            textAlign: 'center',
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,.json,.tsv"
                            onChange={onFileSelect}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />

                        {state.isLoading ? (
                            <>
                                <Loader2
                                    size={48}
                                    style={{
                                        color: 'var(--accent-primary)',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                    Parsing and analyzing your data...
                                </p>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </>
                        ) : (
                            <>
                                <div
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--accent-glow)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Upload size={32} style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <div>
                                    <p
                                        style={{
                                            fontSize: '1.125rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            marginBottom: '0.375rem',
                                        }}
                                    >
                                        {isDragging ? 'Drop your file here!' : 'Drag & drop your data file'}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        or <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>click to browse</span>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Error */}
                {state.error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'var(--danger-bg)',
                            border: '1px solid var(--danger)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem 1.25rem',
                            color: 'var(--danger)',
                            fontSize: '0.875rem',
                            width: '100%',
                        }}
                    >
                        {state.error}
                    </motion.div>
                )}

                {/* Supported formats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {supportedFormats.map((fmt) => (
                        <div
                            key={fmt.ext}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-primary)',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <fmt.icon size={16} style={{ color: fmt.color }} />
                            {fmt.ext}
                        </div>
                    ))}
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1.5rem',
                        width: '100%',
                        marginTop: '2rem',
                    }}
                >
                    {[
                        { title: 'Auto Clean', desc: 'Smart data cleaning removes errors automatically' },
                        { title: 'Smart Charts', desc: 'AI picks the best chart type for your data' },
                        { title: 'Instant KPIs', desc: 'Key metrics detected and highlighted instantly' },
                    ].map((feat) => (
                        <div
                            key={feat.title}
                            className="glass-card"
                            style={{ padding: '1.25rem', textAlign: 'center' }}
                        >
                            <h3
                                style={{
                                    fontSize: '0.9375rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.375rem',
                                }}
                            >
                                {feat.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: '0.8125rem',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.5,
                                }}
                            >
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
