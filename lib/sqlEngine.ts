// ============================================================
// SQL Engine — Client-side SQL execution using AlaSQL
// Loads dataset rows into an in-memory table and executes queries
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
let _alasql: any = null;
function getAlasql(): any {
    if (_alasql) return _alasql;
    if (typeof window === 'undefined') return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _alasql = require('alasql');
    return _alasql;
}

export interface SQLResult {
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    executionTimeMs: number;
    error?: string;
}

/**
 * Execute a SQL query against the dataset.
 * The dataset is loaded into an in-memory table called "data".
 */
export function executeSQL(
    datasetRows: Record<string, unknown>[],
    query: string
): SQLResult {
    const start = performance.now();

    if (!getAlasql()) {
        return {
            columns: [],
            rows: [],
            rowCount: 0,
            executionTimeMs: 0,
            error: 'SQL engine is not available on the server.',
        };
    }

    try {
        // Sanitize: only allow SELECT queries
        const trimmed = query.trim();
        const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
        if (!['SELECT', 'WITH'].includes(firstWord)) {
            return {
                columns: [],
                rows: [],
                rowCount: 0,
                executionTimeMs: 0,
                error: 'Only SELECT queries are allowed for safety.',
            };
        }

        // Execute with data as parameter bound to "data" table reference
        // Use ? parameter binding — AlaSQL replaces "data" table with the array
        const modifiedQuery = trimmed;
        
        // Use alasql with the data as a table reference
        // We bind the array as the "data" table using a parameter
        const queryWithParam = modifiedQuery.replace(/\bFROM\s+data\b/gi, 'FROM ?');
        const result = getAlasql()(queryWithParam, [datasetRows]);
        const elapsed = performance.now() - start;

        if (!result || !Array.isArray(result) || result.length === 0) {
            return {
                columns: [],
                rows: [],
                rowCount: 0,
                executionTimeMs: elapsed,
            };
        }

        // Extract column names from first row
        const columns = Object.keys(result[0]);

        return {
            columns,
            rows: result,
            rowCount: result.length,
            executionTimeMs: elapsed,
        };
    } catch (err) {
        const elapsed = performance.now() - start;
        return {
            columns: [],
            rows: [],
            rowCount: 0,
            executionTimeMs: elapsed,
            error: err instanceof Error ? err.message : 'SQL execution failed.',
        };
    }
}

/**
 * Build a schema description string for the AI prompt.
 * Helps the AI understand column names and types.
 */
export function buildSchemaDescription(
    columns: { name: string; type: string; uniqueCount: number; sampleValues: unknown[] }[]
): string {
    const lines: string[] = ['Table name: data', 'Columns:'];
    for (const col of columns) {
        const samples = col.sampleValues
            .filter((v) => v !== null && v !== undefined)
            .slice(0, 3)
            .map((v) => JSON.stringify(v))
            .join(', ');
        lines.push(`  - ${col.name} (${col.type}, ${col.uniqueCount} unique values, samples: ${samples})`);
    }
    return lines.join('\n');
}
