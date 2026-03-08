// ============================================================
// Data Analyzer — Adaptive chart recommendation engine
// Classifies columns by semantic role and generates charts
// appropriate for ANY data shape, not hardcoded to specific datasets.
// ============================================================

import {
    DataSet,
    ColumnMeta,
    ColumnRole,
    KPI,
    ChartRecommendation,
    ChartType,
    ChartPurpose,
    FilterOption,
    DashboardConfig,
    DataInsight,
    AlertLevel,
    AggregationType,
    getCategoricalPalette,
    getSequentialPalette,
} from './types';
import { formatNumber, formatPercent, getAlertLevel, generateId } from './utils';

// ── Main entry point ─────────────────────────────────────────

export function analyzeDashboard(
    dataset: DataSet,
    isDark: boolean = true
): DashboardConfig {
    const palette = getCategoricalPalette(isDark);

    // Step 1: classify every column by its semantic role
    const roles = classifyColumns(dataset);

    // Step 2: generate KPIs only from 'measure' columns
    const kpis = detectKPIs(dataset, roles);

    // Step 3: generate charts adaptively based on roles
    const charts = recommendCharts(dataset, roles, palette, isDark);

    // Step 4: detect filterable columns
    const filters = detectFilters(dataset, roles);

    // Step 5: generate insights
    const insights = generateInsights(dataset, kpis, roles);

    return { kpis, charts, filters, colorPalette: palette, insights };
}

// ── Column Classification ────────────────────────────────────
// This is the core intelligence: classify each column by what
// it MEANS, not just its data type.

interface ClassifiedColumn {
    col: ColumnMeta;
    role: ColumnRole;
}

function classifyColumns(dataset: DataSet): ClassifiedColumn[] {
    return dataset.columns.map((col) => ({
        col,
        role: inferRole(col, dataset),
    }));
}

function inferRole(col: ColumnMeta, dataset: DataSet): ColumnRole {
    const { type, uniqueCount, totalCount, name, sampleValues } = col;
    const nameL = name.toLowerCase();
    const ratio = uniqueCount / totalCount;

    // ─── Boolean ────────────────────────────────────────────
    if (type === 'boolean') return 'boolean';

    // ─── Date ───────────────────────────────────────────────
    if (type === 'date') return 'date';

    // ─── Numeric columns ───────────────────────────────────
    if (type === 'number') {
        // Detect ID columns: name hints or sequential pattern
        if (/^(id|index|_id|row|rowid|row_id|sr|sno|s\.no|#)$/i.test(nameL)) return 'id';
        if (nameL.endsWith('_id') || nameL.endsWith('id') && nameL.length <= 8) {
            // Likely an ID if ~ 1 unique value per row
            if (ratio > 0.9) return 'id';
        }
        // Sequential integer check: if values go roughly 1..N
        if (ratio > 0.9 && col.min !== undefined && col.max !== undefined) {
            const minV = Number(col.min);
            const maxV = Number(col.max);
            if (maxV - minV + 1 === totalCount || (maxV - minV) / totalCount > 0.9) {
                return 'id';
            }
        }
        return 'measure';
    }

    // ─── String columns ─────────────────────────────────────
    // Detect text/noise columns: email, phone, UUID, URL
    if (isTextColumn(nameL, sampleValues)) return 'text';

    // Cardinality-based classification
    if (uniqueCount <= 2 && totalCount > 10) return 'low-card';
    if (uniqueCount <= 8) return 'low-card';
    if (uniqueCount <= 30) return 'med-card';
    // High-cardinality but still categorical (job titles, cities, etc.)
    if (uniqueCount <= totalCount * 0.5) return 'high-card';
    // Almost unique per row → likely a name/ID field
    return 'text';
}

function isTextColumn(nameL: string, sampleValues: (string | number | boolean | null)[]): boolean {
    // Name-based heuristics
    const textPatterns = /^(email|e_mail|e-mail|mail|phone|tel|telephone|fax|url|website|link|uri|user_?id|userid|uuid|guid|hash|token|password|address|description|comment|note|bio|summary)/i;
    if (textPatterns.test(nameL)) return true;

    // Sample-based: check if values look like emails, phones, UUIDs
    const samples = sampleValues.filter(Boolean).map(String);
    if (samples.length === 0) return false;

    const emailLike = samples.filter((s) => s.includes('@') && s.includes('.')).length;
    if (emailLike / samples.length > 0.5) return true;

    const uuidLike = samples.filter((s) => /^[a-f0-9-]{20,}$/i.test(s)).length;
    if (uuidLike / samples.length > 0.5) return true;

    // Phone-like: mostly digits, dashes, parens, plus
    const phoneLike = samples.filter((s) => /^[\d\s\-\+\(\)\.x]{7,}$/.test(s)).length;
    if (phoneLike / samples.length > 0.5) return true;

    return false;
}

// ── Helpers ─────────────────────────────────────────────────

function byRole(roles: ClassifiedColumn[], ...targetRoles: ColumnRole[]): ClassifiedColumn[] {
    return roles.filter((r) => targetRoles.includes(r.role));
}

// ── KPI Detection (only from measure columns) ───────────────

function detectKPIs(dataset: DataSet, roles: ClassifiedColumn[]): KPI[] {
    const measures = byRole(roles, 'measure');
    const kpis: KPI[] = [];

    for (const { col } of measures.slice(0, 6)) {
        const values = dataset.rows
            .map((r) => r[col.name])
            .filter((v) => v !== null && v !== undefined) as number[];

        if (values.length === 0) continue;

        const total = values.reduce((s, v) => s + v, 0);
        const avg = total / values.length;

        // Trend: compare first half vs second half
        const halfIdx = Math.floor(values.length / 2);
        const firstHalf = values.slice(0, halfIdx);
        const secondHalf = values.slice(halfIdx);
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : 0;
        const change = firstAvg !== 0 ? ((secondAvg - firstAvg) / Math.abs(firstAvg)) * 100 : 0;
        const alertLevel = getAlertLevel(change);

        const useTotal = col.uniqueCount > values.length * 0.5;
        const kpiValue = useTotal ? total : avg;
        const kpiLabel = useTotal ? `Total ${col.name}` : `Avg ${col.name}`;

        const iconMap: Record<AlertLevel, string> = {
            success: 'TrendingUp',
            warning: 'AlertTriangle',
            danger: 'TrendingDown',
            neutral: 'Activity',
        };

        kpis.push({
            id: generateId(),
            label: kpiLabel,
            value: kpiValue,
            formattedValue: formatNumber(kpiValue),
            change: Math.round(change * 10) / 10,
            changeLabel: formatPercent(change),
            alertLevel,
            icon: iconMap[alertLevel],
            columnName: col.name,
        });
    }

    // If no measure columns exist, create summary KPIs from the dataset itself
    if (kpis.length === 0) {
        kpis.push({
            id: generateId(),
            label: 'Total Records',
            value: dataset.rowCount,
            formattedValue: formatNumber(dataset.rowCount),
            alertLevel: 'neutral',
            icon: 'Activity',
            columnName: '',
        });

        // Add unique count KPIs for interesting categoricals
        const cats = byRole(roles, 'low-card', 'med-card', 'high-card');
        for (const { col } of cats.slice(0, 3)) {
            kpis.push({
                id: generateId(),
                label: `Unique ${col.name}`,
                value: col.uniqueCount,
                formattedValue: formatNumber(col.uniqueCount),
                alertLevel: 'neutral',
                icon: 'Activity',
                columnName: col.name,
            });
        }
    }

    return kpis;
}

// ══════════════════════════════════════════════════════════════
// ADAPTIVE CHART RECOMMENDATION ENGINE
// Generates charts based on what column roles are available.
// No hardcoded dataset assumptions — purely generic rules.
// ══════════════════════════════════════════════════════════════

function recommendCharts(
    dataset: DataSet,
    roles: ClassifiedColumn[],
    palette: string[],
    isDark: boolean
): ChartRecommendation[] {
    const charts: ChartRecommendation[] = [];
    let priority = 1;

    const measures = byRole(roles, 'measure');
    const lowCards = byRole(roles, 'low-card');
    const medCards = byRole(roles, 'med-card');
    const highCards = byRole(roles, 'high-card');
    const dates = byRole(roles, 'date');
    const allCats = [...lowCards, ...medCards, ...highCards];
    const trendPalette = getSequentialPalette(isDark, 'cyan');

    // ── STRATEGY 1: Measure + Date → Trend charts ──────────
    for (const dateC of dates.slice(0, 1)) {
        for (const measC of measures.slice(0, 2)) {
            const data = aggregateByDate(dataset.rows, dateC.col.name, measC.col.name);
            if (data.length > 1) {
                charts.push({
                    id: generateId(),
                    type: 'area',
                    title: `${measC.col.name} Over Time`,
                    xAxis: dateC.col.name,
                    yAxis: measC.col.name,
                    data,
                    colorScheme: [palette[1], ...trendPalette.slice(4, 8)],
                    priority: priority++,
                    purpose: 'trend',
                    description: `How ${measC.col.name} changes over time`,
                });
            }
        }
    }

    // ── STRATEGY 2: Measure + Low/Med Category → Comparison ────
    const compCats = [...lowCards, ...medCards];
    for (const catC of compCats.slice(0, 2)) {
        for (const measC of measures.slice(0, 1)) {
            const data = aggregateByCategory(dataset.rows, catC.col.name, measC.col.name);
            if (data.length >= 2) {
                charts.push({
                    id: generateId(),
                    type: 'bar',
                    title: `${measC.col.name} by ${catC.col.name}`,
                    xAxis: catC.col.name,
                    yAxis: measC.col.name,
                    data,
                    colorScheme: palette,
                    priority: priority++,
                    purpose: 'comparison',
                    description: `Compares ${measC.col.name} across ${catC.col.name}`,
                });
            }
        }
    }

    // ── STRATEGY 3: Low-cardinality → Part-to-whole (donut) ────
    for (const catC of lowCards.filter((c) => c.col.uniqueCount <= 8).slice(0, 2)) {
        // Avoid duplicate: check we haven't already made a comparison for this column
        const alreadyCharted = charts.some((c) => c.xAxis === catC.col.name && c.purpose === 'comparison');
        const data = countByCategory(dataset.rows, catC.col.name);
        if (data.length >= 2) {
            charts.push({
                id: generateId(),
                type: 'donut',
                title: `${catC.col.name} Distribution`,
                xAxis: catC.col.name,
                data,
                colorScheme: palette,
                priority: alreadyCharted ? priority++ + 10 : priority++,
                purpose: 'part-to-whole',
                description: `Proportional breakdown of ${catC.col.name}`,
            });
        }
    }

    // ── STRATEGY 4: Two measures → Scatter (correlation) ───────
    if (measures.length >= 2) {
        const sample = dataset.rows.slice(0, 500).map((r) => ({
            [measures[0].col.name]: r[measures[0].col.name],
            [measures[1].col.name]: r[measures[1].col.name],
        }));
        charts.push({
            id: generateId(),
            type: 'scatter',
            title: `${measures[0].col.name} vs ${measures[1].col.name}`,
            xAxis: measures[0].col.name,
            yAxis: measures[1].col.name,
            data: sample,
            colorScheme: [palette[0]],
            priority: priority++,
            purpose: 'correlation',
            description: `Relationship between ${measures[0].col.name} and ${measures[1].col.name}`,
        });
    }

    // ── STRATEGY 5: Measure distribution → Histogram ───────────
    for (const measC of measures.slice(0, 1)) {
        const data = buildHistogram(dataset.rows, measC.col.name);
        if (data.length > 1) {
            const seqPalette = getSequentialPalette(isDark, 'purple');
            charts.push({
                id: generateId(),
                type: 'bar',
                title: `${measC.col.name} Distribution`,
                xAxis: 'Range',
                yAxis: 'Count',
                data,
                colorScheme: seqPalette.slice(3, 8),
                priority: priority++,
                purpose: 'trend',
                description: `Distribution of ${measC.col.name} values`,
            });
        }
    }

    // ══════════════════════════════════════════════════════════
    // FREQUENCY-BASED STRATEGIES (when few or no measure columns)
    // These work for ANY categorical data — names, job titles,
    // cities, statuses, etc. — by counting occurrences.
    // ══════════════════════════════════════════════════════════

    // ── STRATEGY 6: High-cardinality category → Top-N bar ──────
    for (const catC of highCards.slice(0, 2)) {
        const rawData = countByCategory(dataset.rows, catC.col.name, 15);
        // Remap {name, value} → {[colName], Count} for bar chart dataKey matching
        const data = rawData.map((d) => ({ [catC.col.name]: d.name, Count: d.value }));
        if (data.length >= 2) {
            charts.push({
                id: generateId(),
                type: 'bar',
                title: `Top ${Math.min(data.length, 15)} ${catC.col.name}`,
                xAxis: catC.col.name,
                yAxis: 'Count',
                data,
                colorScheme: palette,
                priority: priority++,
                purpose: 'comparison',
                description: `Most frequent ${catC.col.name} values by count`,
            });
        }
    }

    // ── STRATEGY 7: Medium-cardinality → Frequency bar chart ───
    for (const catC of medCards.slice(0, 2)) {
        // Skip if already charted with a measure
        if (charts.some((c) => c.xAxis === catC.col.name)) continue;
        const rawData = countByCategory(dataset.rows, catC.col.name, 20);
        // Remap {name, value} → {[colName], Count} for bar chart dataKey matching
        const data = rawData.map((d) => ({ [catC.col.name]: d.name, Count: d.value }));
        if (data.length >= 2) {
            charts.push({
                id: generateId(),
                type: 'bar',
                title: `${catC.col.name} Frequency`,
                xAxis: catC.col.name,
                yAxis: 'Count',
                data,
                colorScheme: palette,
                priority: priority++,
                purpose: 'comparison',
                description: `Distribution of ${catC.col.name} by count`,
            });
        }
    }

    // ── STRATEGY 8: Date → Temporal frequency distribution ─────
    for (const dateC of dates.slice(0, 1)) {
        // Extract decade/year groupings automatically
        const yearData = aggregateDateComponent(dataset.rows, dateC.col.name, 'year');
        if (yearData.length > 3) {
            // If many years, group by decade instead
            const decadeData = aggregateDateComponent(dataset.rows, dateC.col.name, 'decade');
            if (decadeData.length >= 2) {
                charts.push({
                    id: generateId(),
                    type: 'bar',
                    title: `Records by Decade`,
                    xAxis: 'Decade',
                    yAxis: 'Count',
                    data: decadeData,
                    colorScheme: getSequentialPalette(isDark, 'teal').slice(2, 8),
                    priority: priority++,
                    purpose: 'trend',
                    description: `Temporal distribution by decade`,
                });
            }
        } else if (yearData.length >= 2) {
            charts.push({
                id: generateId(),
                type: 'bar',
                title: `Records by Year`,
                xAxis: 'Year',
                yAxis: 'Count',
                data: yearData,
                colorScheme: getSequentialPalette(isDark, 'teal').slice(2, 8),
                priority: priority++,
                purpose: 'trend',
                description: `Temporal distribution by year`,
            });
        }

        // Monthly distribution (aggregating month-of-year regardless of year)
        const monthData = aggregateDateComponent(dataset.rows, dateC.col.name, 'month');
        if (monthData.length >= 4) {
            charts.push({
                id: generateId(),
                type: 'area',
                title: `Records by Month`,
                xAxis: 'Month',
                yAxis: 'Count',
                data: monthData,
                colorScheme: [palette[2]],
                priority: priority++,
                purpose: 'trend',
                description: `Monthly distribution across all years`,
            });
        }
    }

    // ── STRATEGY 9: Cross-tabulation (low-card × date component) ──
    if (lowCards.length > 0 && dates.length > 0) {
        const bestCat = lowCards[0];
        const dateCol = dates[0];
        const crossData = crossTabulate(dataset.rows, bestCat.col.name, dateCol.col.name);
        if (crossData.data.length >= 2) {
            charts.push({
                id: generateId(),
                type: 'bar',
                title: `${bestCat.col.name} by Decade`,
                xAxis: 'Decade',
                yAxis: 'Count',
                data: crossData.data,
                colorScheme: palette,
                priority: priority++,
                purpose: 'comparison',
                description: `${bestCat.col.name} distribution across decades`,
                // Store the series info for grouped rendering
            });
        }
    }

    // ── STRATEGY 10: Extra measure+category combos ─────────────
    if (compCats.length >= 2 && measures.length >= 2) {
        const data = aggregateByCategory(dataset.rows, compCats[1].col.name, measures[1].col.name);
        if (data.length >= 2) {
            charts.push({
                id: generateId(),
                type: 'line',
                title: `${measures[1].col.name} by ${compCats[1].col.name}`,
                xAxis: compCats[1].col.name,
                yAxis: measures[1].col.name,
                data,
                colorScheme: [palette[3]],
                priority: priority++,
                purpose: 'comparison',
                description: `${measures[1].col.name} across ${compCats[1].col.name}`,
            });
        }
    }

    // De-duplicate and limit
    const seen = new Set<string>();
    const unique = charts.filter((c) => {
        const key = `${c.type}-${c.xAxis}-${c.yAxis || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return unique.sort((a, b) => a.priority - b.priority).slice(0, 8);
}

// ── Data Aggregation Helpers ─────────────────────────────────

function aggregateByDate(
    rows: Record<string, unknown>[],
    dateCol: string,
    numCol: string
): Record<string, unknown>[] {
    const grouped = new Map<string, { sum: number; count: number }>();
    for (const row of rows) {
        const dateVal = row[dateCol];
        const numVal = row[numCol];
        if (dateVal == null || numVal == null) continue;
        const d = new Date(dateVal as string);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const existing = grouped.get(key) || { sum: 0, count: 0 };
        existing.sum += Number(numVal);
        existing.count++;
        grouped.set(key, existing);
    }
    return Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({ [dateCol]: key, [numCol]: Math.round(val.sum * 100) / 100 }));
}

function aggregateByCategory(
    rows: Record<string, unknown>[],
    catCol: string,
    numCol: string,
    agg: AggregationType = 'sum'
): Record<string, unknown>[] {
    const grouped = new Map<string, { sum: number; count: number; min: number; max: number }>();
    for (const row of rows) {
        const cat = row[catCol];
        const num = row[numCol];
        if (cat == null || num == null) continue;
        const key = String(cat);
        const numV = Number(num);
        const existing = grouped.get(key) || { sum: 0, count: 0, min: Infinity, max: -Infinity };
        existing.sum += numV;
        existing.count++;
        existing.min = Math.min(existing.min, numV);
        existing.max = Math.max(existing.max, numV);
        grouped.set(key, existing);
    }
    return Array.from(grouped.entries())
        .sort((a, b) => b[1].sum - a[1].sum)
        .slice(0, 15)
        .map(([key, val]) => {
            let value: number;
            switch (agg) {
                case 'avg': value = val.sum / val.count; break;
                case 'count': value = val.count; break;
                case 'min': value = val.min; break;
                case 'max': value = val.max; break;
                default: value = val.sum;
            }
            return { [catCol]: key, [numCol]: Math.round(value * 100) / 100 };
        });
}

function countByCategory(
    rows: Record<string, unknown>[],
    catCol: string,
    topN: number = 20
): Record<string, unknown>[] {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const val = row[catCol];
        if (val == null || val === '') continue;
        const key = String(val);
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([name, value]) => ({ name, value }));
}

function aggregateDateComponent(
    rows: Record<string, unknown>[],
    dateCol: string,
    component: 'year' | 'decade' | 'month' | 'day-of-week'
): Record<string, unknown>[] {
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Map<string, number>();

    for (const row of rows) {
        const val = row[dateCol];
        if (val == null) continue;
        const d = new Date(val as string);
        if (isNaN(d.getTime())) continue;

        let key: string;
        switch (component) {
            case 'year':
                key = String(d.getFullYear());
                break;
            case 'decade':
                key = `${Math.floor(d.getFullYear() / 10) * 10}s`;
                break;
            case 'month':
                key = MONTH_NAMES[d.getMonth()];
                break;
            case 'day-of-week':
                key = DAY_NAMES[d.getDay()];
                break;
        }
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    let entries = Array.from(counts.entries());

    // Sort appropriately
    if (component === 'month') {
        entries.sort((a, b) => MONTH_NAMES.indexOf(a[0]) - MONTH_NAMES.indexOf(b[0]));
    } else if (component === 'day-of-week') {
        entries.sort((a, b) => DAY_NAMES.indexOf(a[0]) - DAY_NAMES.indexOf(b[0]));
    } else {
        entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    const label = component === 'decade' ? 'Decade' :
        component === 'year' ? 'Year' :
            component === 'month' ? 'Month' : 'Day';

    return entries.map(([k, v]) => ({ [label]: k, Count: v }));
}

function crossTabulate(
    rows: Record<string, unknown>[],
    catCol: string,
    dateCol: string
): { data: Record<string, unknown>[]; series: string[] } {
    // Group by decade, then by category value
    const decadeCat = new Map<string, Map<string, number>>();
    const allCatValues = new Set<string>();

    for (const row of rows) {
        const catVal = row[catCol];
        const dateVal = row[dateCol];
        if (catVal == null || dateVal == null) continue;
        const d = new Date(dateVal as string);
        if (isNaN(d.getTime())) continue;

        const decade = `${Math.floor(d.getFullYear() / 10) * 10}s`;
        const catKey = String(catVal);
        allCatValues.add(catKey);

        if (!decadeCat.has(decade)) decadeCat.set(decade, new Map());
        const inner = decadeCat.get(decade)!;
        inner.set(catKey, (inner.get(catKey) || 0) + 1);
    }

    const series = Array.from(allCatValues);
    const data = Array.from(decadeCat.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([decade, inner]) => {
            const entry: Record<string, unknown> = { Decade: decade };
            for (const s of series) {
                entry[s] = inner.get(s) || 0;
            }
            entry.Count = Array.from(inner.values()).reduce((s, v) => s + v, 0);
            return entry;
        });

    return { data, series };
}

function buildHistogram(
    rows: Record<string, unknown>[],
    numCol: string,
    bins: number = 10
): Record<string, unknown>[] {
    const values = rows
        .map((r) => r[numCol])
        .filter((v) => v !== null && v !== undefined) as number[];
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return [{ Range: String(min), Count: values.length }];
    const binWidth = (max - min) / bins;
    const histogram: { range: string; count: number }[] = [];
    for (let i = 0; i < bins; i++) {
        const lo = min + i * binWidth;
        const hi = lo + binWidth;
        const count = values.filter((v) => (i === bins - 1 ? v >= lo && v <= hi : v >= lo && v < hi)).length;
        histogram.push({ range: `${formatBinValue(lo)}-${formatBinValue(hi)}`, count });
    }
    return histogram.map((h) => ({ Range: h.range, Count: h.count }));
}

function formatBinValue(v: number): string {
    if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
    return v.toFixed(1);
}

// ── Data Insight Generation ──────────────────────────────────

function generateInsights(dataset: DataSet, kpis: KPI[], roles: ClassifiedColumn[]): DataInsight[] {
    const insights: DataInsight[] = [];
    const measures = byRole(roles, 'measure');

    // 1. Trend insights from KPIs
    for (const kpi of kpis) {
        if (kpi.change !== undefined && Math.abs(kpi.change) >= 5) {
            const direction = kpi.change > 0 ? 'increased' : 'decreased';
            insights.push({
                id: generateId(),
                text: `${kpi.label} has ${direction} by ${Math.abs(kpi.change).toFixed(1)}% compared to the first half of the dataset.`,
                category: 'trend',
                alertLevel: kpi.alertLevel,
            });
        }
    }

    // 2. Outlier detection: columns with high variance
    for (const { col } of measures.slice(0, 3)) {
        const values = dataset.rows
            .map((r) => r[col.name])
            .filter((v) => v !== null && v !== undefined) as number[];
        if (values.length < 5) continue;
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const cv = avg !== 0 ? (stdDev / Math.abs(avg)) * 100 : 0;
        if (cv > 50) {
            insights.push({
                id: generateId(),
                text: `${col.name} shows high variability (CV: ${cv.toFixed(0)}%), which may indicate outliers or subgroups.`,
                category: 'outlier',
                alertLevel: 'warning',
            });
        }
    }

    // 3. Distribution dominance in categoricals
    const allCats = byRole(roles, 'low-card', 'med-card');
    for (const { col } of allCats.slice(0, 2)) {
        const counts = new Map<string, number>();
        for (const row of dataset.rows) {
            const val = row[col.name];
            if (val == null) continue;
            counts.set(String(val), (counts.get(String(val)) || 0) + 1);
        }
        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        if (sorted.length >= 2) {
            const topPct = (sorted[0][1] / dataset.rowCount) * 100;
            if (topPct >= 40) {
                insights.push({
                    id: generateId(),
                    text: `"${sorted[0][0]}" dominates ${col.name} at ${topPct.toFixed(0)}% of all records.`,
                    category: 'distribution',
                    alertLevel: 'neutral',
                });
            }
        }
    }

    // 4. Column role summary insight
    const skipped = byRole(roles, 'id', 'text');
    if (skipped.length > 0) {
        const names = skipped.map((r) => r.col.name).join(', ');
        insights.push({
            id: generateId(),
            text: `Skipped ${skipped.length} column(s) from visualization (identifiers/text): ${names}.`,
            category: 'distribution',
            alertLevel: 'neutral',
        });
    }

    // 5. Missing data
    const highMissing = dataset.columns.filter((c) => c.nullCount > 0 && (c.nullCount / c.totalCount) > 0.1);
    if (highMissing.length > 0) {
        const names = highMissing.map((c) => `${c.name} (${((c.nullCount / c.totalCount) * 100).toFixed(0)}%)`).join(', ');
        insights.push({
            id: generateId(),
            text: `Columns with significant missing data: ${names}.`,
            category: 'distribution',
            alertLevel: 'warning',
        });
    }

    return insights;
}

// ── Filter Detection ─────────────────────────────────────────

function detectFilters(dataset: DataSet, roles: ClassifiedColumn[]): FilterOption[] {
    const filters: FilterOption[] = [];

    // Use low/med cardinality columns as filters
    const filterCols = byRole(roles, 'low-card', 'med-card');
    for (const { col } of filterCols.slice(0, 4)) {
        const uniqueVals = Array.from(
            new Set(
                dataset.rows
                    .map((r) => r[col.name])
                    .filter((v) => v !== null && v !== undefined && v !== '') as string[]
            )
        ).sort();
        filters.push({ column: col.name, type: col.type, values: uniqueVals, selectedValues: uniqueVals });
    }

    for (const { col } of byRole(roles, 'date').slice(0, 1)) {
        filters.push({
            column: col.name,
            type: col.type,
            values: [],
            selectedValues: [],
            dateRange: { start: col.min as string || '', end: col.max as string || '' },
        });
    }

    return filters;
}

// ── Custom Chart Builder Helper ──────────────────────────────
// Used by the CustomChartBuilder component to generate user-defined charts.

export function buildCustomChart(
    dataset: DataSet,
    xColumn: string,
    yColumn: string | null,
    chartType: ChartType,
    aggregation: AggregationType,
    isDark: boolean
): ChartRecommendation {
    const palette = getCategoricalPalette(isDark);
    let data: Record<string, unknown>[];
    let yAxis: string;

    if (yColumn && aggregation !== 'count') {
        // Aggregate yColumn by xColumn using the selected aggregation
        data = aggregateByCategory(dataset.rows, xColumn, yColumn, aggregation);
        yAxis = yColumn;
    } else {
        // Count-based: count occurrences of each xColumn value
        data = countByCategory(dataset.rows, xColumn, 20);
        yAxis = 'Count';
        // Remap for non-donut charts: {name, value} → {xColumn, Count}
        if (chartType !== 'donut' && chartType !== 'pie') {
            data = data.map((d) => ({ [xColumn]: d.name, Count: d.value }));
        }
    }

    let purpose: ChartPurpose = 'comparison';
    if (chartType === 'donut' || chartType === 'pie') purpose = 'part-to-whole';
    if (chartType === 'scatter') purpose = 'correlation';
    if (chartType === 'area' || chartType === 'line') purpose = 'trend';

    return {
        id: generateId(),
        type: chartType,
        title: yColumn && aggregation !== 'count'
            ? `${aggregation.toUpperCase()} of ${yColumn} by ${xColumn}`
            : `${xColumn} Count`,
        xAxis: xColumn,
        yAxis: chartType === 'donut' || chartType === 'pie' ? undefined : yAxis,
        data,
        colorScheme: palette,
        priority: 100,
        purpose,
        description: `Custom chart: ${chartType}`,
    };
}

// ── Apply filters to data ────────────────────────────────────

export function applyFilters(
    dataset: DataSet,
    filters: FilterOption[]
): Record<string, unknown>[] {
    let rows = [...dataset.rows];
    for (const filter of filters) {
        if (filter.type === 'date' && filter.dateRange) {
            const { start, end } = filter.dateRange;
            if (start || end) {
                rows = rows.filter((row) => {
                    const val = row[filter.column] as string;
                    if (!val) return true;
                    if (start && val < start) return false;
                    if (end && val > end) return false;
                    return true;
                });
            }
        } else if (filter.selectedValues.length < filter.values.length) {
            const selected = new Set(filter.selectedValues.map(String));
            rows = rows.filter((row) => {
                const val = row[filter.column];
                if (val === null || val === undefined) return true;
                return selected.has(String(val));
            });
        }
    }
    return rows;
}
