// ============================================================
// Utility functions: formatting, color helpers, etc.
// ============================================================

import { AlertLevel, getAlertColorForTheme } from './types';

/**
 * Format a number for display (e.g. 1234567 → "1.23M")
 */
export function formatNumber(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '—';

    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
    if (abs >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (abs >= 1_000) return (value / 1_000).toFixed(2) + 'K';
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

/**
 * Determine alert level based on a percentage change
 */
export function getAlertLevel(change: number | undefined): AlertLevel {
    if (change === undefined || change === null) return 'neutral';
    if (change >= 5) return 'success';
    if (change >= -5) return 'warning';
    return 'danger';
}

/**
 * Get the CSS color for an alert level (defaults to dark theme)
 */
export function getAlertColor(level: AlertLevel, isDark: boolean = true): string {
    return getAlertColorForTheme(level, isDark);
}

/**
 * Safely parse a date string, returns Date or null
 */
export function safeParseDate(value: unknown): Date | null {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

/**
 * Truncate a string
 */
export function truncate(str: string, maxLength: number = 30): string {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '…' : str;
}

/**
 * Compute median of a sorted numeric array
 */
export function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute mean of a numeric array
 */
export function mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

/**
 * Compute mode of an array
 */
export function mode<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    const freq = new Map<T, number>();
    let maxFreq = 0;
    let modeVal: T = arr[0];
    for (const v of arr) {
        const count = (freq.get(v) || 0) + 1;
        freq.set(v, count);
        if (count > maxFreq) {
            maxFreq = count;
            modeVal = v;
        }
    }
    return modeVal;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * CN - class name merge helper (simple version)
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
}
