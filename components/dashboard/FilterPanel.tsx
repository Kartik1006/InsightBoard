'use client';

import { FilterOption } from '@/lib/types';
import { Filter } from 'lucide-react';

interface FilterPanelProps {
    filters: FilterOption[];
    onFiltersChange: (filters: FilterOption[]) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
    const handleCategoryFilter = (filterIndex: number, value: string, checked: boolean) => {
        const updated = [...filters];
        const filter = { ...updated[filterIndex] };

        if (checked) {
            filter.selectedValues = [...filter.selectedValues, value];
        } else {
            filter.selectedValues = filter.selectedValues.filter((v) => String(v) !== value);
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

    // Count active filters
    const activeFilterCount = filters.reduce((count, f) => {
        if (f.type === 'date' && f.dateRange && (f.dateRange.start || f.dateRange.end)) return count + 1;
        if (f.type === 'string' && f.selectedValues.length < f.values.length) return count + 1;
        return count;
    }, 0);

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                height: 'fit-content',
                position: 'sticky',
                top: 80,
            }}
        >
            {/* Header */}
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
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <Filter size={16} style={{ color: 'var(--accent-primary)' }} />
                    Filters
                    {activeFilterCount > 0 && (
                        <span
                            style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                background: 'var(--accent-primary)',
                                color: 'white',
                                borderRadius: 'var(--radius-full)',
                                width: 18,
                                height: 18,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {activeFilterCount}
                        </span>
                    )}
                </h3>
                <button
                    onClick={resetFilters}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    Reset All
                </button>
            </div>

            {/* Category Filters */}
            {filters
                .filter((f) => f.type === 'string')
                .map((filter) => {
                    const filterIndex = filters.indexOf(filter);
                    const isFiltered = filter.selectedValues.length < filter.values.length;
                    return (
                        <div key={filter.column} style={{ marginBottom: '1.25rem' }}>
                            <label
                                style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <span>{filter.column}</span>
                                {isFiltered && (
                                    <span style={{ color: 'var(--accent-primary)', fontSize: '0.625rem', fontWeight: 500, textTransform: 'none' }}>
                                        {filter.selectedValues.length}/{filter.values.length}
                                    </span>
                                )}
                            </label>
                            <div
                                style={{
                                    maxHeight: 160,
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1px',
                                }}
                            >
                                {filter.values.map((val) => {
                                    const isSelected = filter.selectedValues.some(
                                        (sv) => String(sv) === String(val)
                                    );
                                    return (
                                        <label
                                            key={String(val)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.375rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.8125rem',
                                                color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                                                transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background = 'var(--bg-card-hover)')
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background = 'transparent')
                                            }
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) =>
                                                    handleCategoryFilter(filterIndex, String(val), e.target.checked)
                                                }
                                                style={{
                                                    accentColor: 'var(--accent-primary)',
                                                    width: 14,
                                                    height: 14,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {String(val)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

            {/* Date Filters */}
            {filters
                .filter((f) => f.type === 'date')
                .map((filter) => {
                    const filterIndex = filters.indexOf(filter);
                    return (
                        <div key={filter.column} style={{ marginBottom: '1.25rem' }}>
                            <label
                                style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {filter.column}
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>From</span>
                                    <input
                                        type="date"
                                        className="filter-select"
                                        value={filter.dateRange?.start || ''}
                                        onChange={(e) => handleDateFilter(filterIndex, 'start', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>To</span>
                                    <input
                                        type="date"
                                        className="filter-select"
                                        value={filter.dateRange?.end || ''}
                                        onChange={(e) => handleDateFilter(filterIndex, 'end', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
