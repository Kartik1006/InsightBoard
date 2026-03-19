'use client';

import { FilterOption } from '@/lib/types';
import { Filter, ListFilter } from 'lucide-react';

interface FilterPanelProps {
    filters: FilterOption[];
    onFiltersChange: (filters: FilterOption[]) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
    const handleCategoryFilter = (filterIndex: number, value: string) => {
        const updated = [...filters];
        const filter = { ...updated[filterIndex] };

        if (filter.selectedValues.includes(value)) {
            filter.selectedValues = filter.selectedValues.filter((v) => String(v) !== value);
        } else {
            filter.selectedValues = [...filter.selectedValues, value];
        }

        updated[filterIndex] = filter;
        onFiltersChange(updated);
    };

    const handleDateFilter = (filterIndex: number, field: 'start' | 'end', value: string) => {
        const updated = [...filters];
        const filter = { ...updated[filterIndex] };
        filter.dateRange = { ...filter.dateRange!, [field]: value };
        updated[filterIndex] = filter;
        onFiltersChange(updated);
    };

    const resetFilters = () => {
        const reset = filters.map((f) => ({
            ...f,
            selectedValues: [...f.values],
            dateRange: f.dateRange ? { start: '', end: '' } : undefined,
        }));
        onFiltersChange(reset);
    };

    const activeFilterCount = filters.reduce((count, f) => {
        if (f.type === 'date' && f.dateRange && (f.dateRange.start || f.dateRange.end)) return count + 1;
        if (f.type === 'string' && f.selectedValues.length < f.values.length) return count + 1;
        return count;
    }, 0);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-primary)',
                padding: '0.75rem 2rem',
                position: 'sticky',
                top: 64,
                zIndex: 40,
                width: '100%',
                overflowX: 'auto',
                scrollbarWidth: 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderRight: '1px solid var(--border-secondary)', paddingRight: '1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                    <ListFilter size={16} />
                    View
                    {activeFilterCount > 0 && (
                        <span style={{ fontSize: '0.625rem', background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '0.1rem 0.4rem', borderRadius: '1rem' }}>
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={resetFilters}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                    Reset
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexShrink: 0 }}>
                {filters.filter((f) => f.type === 'string').map((filter) => {
                    const filterIndex = filters.indexOf(filter);
                    const isFiltered = filter.selectedValues.length < filter.values.length;
                    
                    return (
                        <div key={filter.column} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{filter.column}</span>
                            <select
                                value={filter.selectedValues.length === 1 ? filter.selectedValues[0] : ""}
                                onChange={(e) => handleCategoryFilter(filterIndex, e.target.value)}
                                style={{
                                    padding: '0.375rem 2rem 0.375rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${isFiltered ? 'var(--text-primary)' : 'var(--border-secondary)'}`,
                                    background: isFiltered ? 'var(--bg-card-hover)' : 'transparent',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundSize: '1em',
                                }}
                            >
                                <option value="" disabled hidden>{isFiltered ? `${filter.selectedValues.length} selected` : 'All options'}</option>
                                {filter.values.map((val) => (
                                    <option key={String(val)} value={String(val)}>
                                        {filter.selectedValues.includes(String(val)) ? `✓ ${String(val)}` : String(val)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                })}

                {filters.filter((f) => f.type === 'date').map((filter) => {
                    const filterIndex = filters.indexOf(filter);
                    return (
                        <div key={filter.column} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Date</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="date"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-primary)' }}
                                    value={filter.dateRange?.start || ''}
                                    onChange={(e) => handleDateFilter(filterIndex, 'start', e.target.value)}
                                />
                                <span style={{ color: 'var(--border-secondary)' }}>—</span>
                                <input
                                    type="date"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-primary)' }}
                                    value={filter.dateRange?.end || ''}
                                    onChange={(e) => handleDateFilter(filterIndex, 'end', e.target.value)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
