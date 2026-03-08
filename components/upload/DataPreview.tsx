'use client';

import { useDataStore } from '@/hooks/useDataStore';

export function DataPreview() {
    const { state } = useDataStore();
    const { cleanedDataset } = state;

    if (!cleanedDataset) return null;

    const displayRows = cleanedDataset.rows.slice(0, 100);
    const columns = cleanedDataset.columns;

    const typeBadgeClass: Record<string, string> = {
        number: 'badge badge-number',
        string: 'badge badge-string',
        date: 'badge badge-date',
        boolean: 'badge badge-boolean',
    };

    return (
        <div style={{ padding: '0 2rem' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                }}
            >
                <h3
                    style={{
                        fontSize: '0.9375rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                    }}
                >
                    Data Preview
                    <span
                        style={{
                            fontWeight: 400,
                            color: 'var(--text-muted)',
                            marginLeft: '0.5rem',
                            fontSize: '0.8125rem',
                        }}
                    >
                        (showing {displayRows.length} of {cleanedDataset.rowCount.toLocaleString()} rows)
                    </span>
                </h3>
            </div>

            <div
                style={{
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    maxHeight: 400,
                    overflowY: 'auto',
                }}
            >
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: 50, textAlign: 'center' }}>#</th>
                            {columns.map((col) => (
                                <th key={col.name}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span>{col.name}</span>
                                        <span className={typeBadgeClass[col.type] || 'badge'}>
                                            {col.type}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayRows.map((row, i) => (
                            <tr key={i}>
                                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{i + 1}</td>
                                {columns.map((col) => {
                                    const val = row[col.name];
                                    const isNull = val === null || val === undefined || val === '';
                                    return (
                                        <td
                                            key={col.name}
                                            style={{
                                                color: isNull ? 'var(--text-muted)' : 'var(--text-primary)',
                                                fontStyle: isNull ? 'italic' : 'normal',
                                            }}
                                        >
                                            {isNull ? 'null' : String(val)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
