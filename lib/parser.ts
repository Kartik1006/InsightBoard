// ============================================================
// Data Parser — CSV, Excel, JSON → unified DataSet
// ============================================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataSet, ColumnMeta, ColumnType } from './types';
import { safeParseDate, mean, median as medianFn, generateId } from './utils';

/**
 * Top-level parse dispatcher — detects file type and delegates
 */
export async function parseFile(file: File): Promise<DataSet> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    let rawRows: Record<string, unknown>[];

    if (ext === 'csv' || ext === 'tsv') {
        rawRows = await parseCSV(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
        rawRows = await parseExcel(file);
    } else if (ext === 'json') {
        rawRows = await parseJSON(file);
    } else {
        throw new Error(`Unsupported file type: .${ext}. Please upload CSV, Excel, or JSON.`);
    }

    if (rawRows.length === 0) {
        throw new Error('The file appears to be empty. Please upload a file with data.');
    }

    const columns = inferColumns(rawRows);
    const coercedRows = coerceRows(rawRows, columns);

    return {
        columns,
        rows: coercedRows,
        fileName: file.name,
        rowCount: coercedRows.length,
        columnCount: columns.length,
    };
}

// ── CSV ──────────────────────────────────────────────────────

function parseCSV(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    reject(new Error('Failed to parse CSV: ' + results.errors[0]?.message));
                }
                resolve(results.data as Record<string, unknown>[]);
            },
            error: (err: Error) => reject(err),
        });
    });
}

// ── Excel ────────────────────────────────────────────────────

function parseExcel(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file.'));
        reader.readAsArrayBuffer(file);
    });
}

// ── JSON ─────────────────────────────────────────────────────

function parseJSON(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const raw = JSON.parse(e.target?.result as string);
                if (Array.isArray(raw)) {
                    resolve(raw);
                } else if (typeof raw === 'object' && raw !== null) {
                    // Handle { data: [...] } or { results: [...] } patterns
                    const arrayKey = Object.keys(raw).find((k) => Array.isArray(raw[k]));
                    if (arrayKey) {
                        resolve(raw[arrayKey]);
                    } else {
                        resolve([raw]); // single object → treat as one row
                    }
                } else {
                    reject(new Error('JSON must be an array of objects or an object with a data array.'));
                }
            } catch {
                reject(new Error('Invalid JSON file.'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read JSON file.'));
        reader.readAsText(file);
    });
}

// ── Column Inference ─────────────────────────────────────────

function inferColumnType(values: unknown[]): ColumnType {
    const nonNullValues = values.filter(
        (v) => v !== null && v !== undefined && v !== ''
    );
    if (nonNullValues.length === 0) return 'string';

    let numCount = 0;
    let dateCount = 0;
    let boolCount = 0;

    const sampleSize = Math.min(nonNullValues.length, 100);
    for (let i = 0; i < sampleSize; i++) {
        const v = nonNullValues[i];

        if (typeof v === 'boolean') {
            boolCount++;
            continue;
        }
        if (typeof v === 'number' && !isNaN(v)) {
            numCount++;
            continue;
        }
        if (typeof v === 'string') {
            // Check if it's a number string
            const num = Number(v);
            if (!isNaN(num) && v.trim() !== '') {
                numCount++;
                continue;
            }
            // Check if it's a boolean string
            if (['true', 'false', 'yes', 'no', '0', '1'].includes(v.toLowerCase().trim())) {
                boolCount++;
                continue;
            }
            // Check if it's a date
            if (safeParseDate(v) !== null && v.length > 4) {
                dateCount++;
                continue;
            }
        }
    }

    const threshold = sampleSize * 0.6;
    if (numCount >= threshold) return 'number';
    if (dateCount >= threshold) return 'date';
    if (boolCount >= threshold) return 'boolean';
    return 'string';
}

function inferColumns(rows: Record<string, unknown>[]): ColumnMeta[] {
    if (rows.length === 0) return [];

    const allKeys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));

    return Array.from(allKeys).map((key) => {
        const values = rows.map((r) => r[key]);
        const type = inferColumnType(values);

        const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
        const nullCount = values.length - nonNull.length;

        const uniqueValues = new Set(nonNull.map(String));

        const meta: ColumnMeta = {
            name: key,
            type,
            uniqueCount: uniqueValues.size,
            nullCount,
            totalCount: values.length,
            sampleValues: nonNull.slice(0, 5) as (string | number | boolean | null)[],
        };

        if (type === 'number') {
            const nums = nonNull
                .map((v) => (typeof v === 'number' ? v : Number(v)))
                .filter((n) => !isNaN(n));
            if (nums.length > 0) {
                meta.min = Math.min(...nums);
                meta.max = Math.max(...nums);
                meta.mean = mean(nums);
                meta.median = medianFn(nums);
            }
        }

        if (type === 'date') {
            const dates = nonNull
                .map((v) => safeParseDate(v))
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime());
            if (dates.length > 0) {
                meta.min = dates[0].toISOString();
                meta.max = dates[dates.length - 1].toISOString();
            }
        }

        return meta;
    });
}

// ── Type Coercion ────────────────────────────────────────────

function coerceRows(
    rows: Record<string, unknown>[],
    columns: ColumnMeta[]
): Record<string, unknown>[] {
    return rows.map((row) => {
        const coerced: Record<string, unknown> = {};
        for (const col of columns) {
            const raw = row[col.name];
            if (raw === null || raw === undefined || raw === '') {
                coerced[col.name] = null;
                continue;
            }
            switch (col.type) {
                case 'number':
                    coerced[col.name] = typeof raw === 'number' ? raw : Number(raw);
                    if (isNaN(coerced[col.name] as number)) coerced[col.name] = null;
                    break;
                case 'date':
                    coerced[col.name] = safeParseDate(raw)?.toISOString() ?? null;
                    break;
                case 'boolean':
                    if (typeof raw === 'boolean') coerced[col.name] = raw;
                    else {
                        const s = String(raw).toLowerCase().trim();
                        coerced[col.name] = ['true', 'yes', '1'].includes(s);
                    }
                    break;
                default:
                    coerced[col.name] = typeof raw === 'string' ? raw.trim() : String(raw);
            }
        }
        return coerced;
    });
}

// Re-export generateId for convenience
export { generateId };
