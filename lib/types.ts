// ============================================================
// Core data types for the Interactive Dashboard Application
// Carbon Design System color palettes for data visualization
// ============================================================

export type ColumnType = 'number' | 'date' | 'string' | 'boolean';

// Semantic role classification for columns (auto-detected)
export type ColumnRole =
  | 'id'           // sequential IDs, UUIDs, hashes → skip for visualization
  | 'measure'      // meaningful numeric data (revenue, count, rating)
  | 'low-card'     // ≤8 unique string values (gender, status, region)
  | 'med-card'     // 9–30 unique string values (department, city)
  | 'high-card'    // 30+ unique string values (name, job title) → top-N
  | 'date'         // date/time column
  | 'text'         // long text, emails, phone → skip for charts
  | 'boolean';     // true/false

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface CustomChartConfig {
  chartType: ChartType;
  xColumn: string;
  yColumn?: string;       // optional — if omitted, uses Count
  aggregation: AggregationType;
}

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  uniqueCount: number;
  nullCount: number;
  totalCount: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  sampleValues: (string | number | boolean | null)[];
}

export interface DataSet {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  fileName: string;
  rowCount: number;
  columnCount: number;
}

export interface CleaningAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'remove' | 'fill' | 'transform' | 'format';
  isDestructive: boolean;
}

export interface CleaningResult {
  dataset: DataSet;
  actionApplied: string;
  rowsAffected: number;
  columnsAffected: number;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'histogram' | 'donut' | 'radar' | 'step';

// Carbon alert palette
export type AlertLevel = 'success' | 'warning' | 'danger' | 'neutral';

// Chart purpose categorization (from Carbon chart taxonomy)
export type ChartPurpose = 'comparison' | 'trend' | 'part-to-whole' | 'correlation';

export interface KPI {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  change?: number;
  changeLabel?: string;
  alertLevel: AlertLevel;
  icon: string;
  columnName: string;
}

export interface ChartRecommendation {
  id: string;
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis?: string;
  data: Record<string, unknown>[];
  colorScheme: string[];
  priority: number;
  purpose: ChartPurpose;
  description?: string; // insight description
}

export interface FilterOption {
  column: string;
  type: ColumnType;
  values: (string | number)[];
  selectedValues: (string | number)[];
  dateRange?: { start: string; end: string };
}

export interface DataInsight {
  id: string;
  text: string;
  category: 'trend' | 'outlier' | 'distribution' | 'correlation';
  alertLevel: AlertLevel;
}

export interface DashboardConfig {
  kpis: KPI[];
  charts: ChartRecommendation[];
  filters: FilterOption[];
  colorPalette: string[];
  insights: DataInsight[];
}

// ============================================================
// Carbon Design System — Data Visualization Color Palettes
// Reference: https://carbondesignsystem.com/data-visualization/color-palettes/
// ============================================================

// Categorical palette — 14-color sequence for distinguishing discrete categories
// Applied in strict sequence to maximize contrast between neighbors
export const CARBON_CATEGORICAL_LIGHT: string[] = [
  '#6929c4', // Purple 70
  '#1192e8', // Cyan 50
  '#005d5d', // Teal 70
  '#9f1853', // Magenta 70
  '#fa4d56', // Red 50
  '#570408', // Red 90
  '#198038', // Green 60
  '#002d9c', // Blue 80
  '#ee538b', // Magenta 50
  '#b28600', // Yellow 50
  '#009d9a', // Teal 50
  '#012749', // Cyan 90
  '#8a3800', // Orange 70
  '#a56eff', // Purple 50
];

// For dark backgrounds: brighter/lighter tones to ensure readability
export const CARBON_CATEGORICAL_DARK: string[] = [
  '#8a3ffc', // Purple 60
  '#33b1ff', // Cyan 40
  '#007d79', // Teal 60
  '#ff7eb6', // Magenta 40
  '#fa4d56', // Red 50
  '#fff1f1', // Red 10
  '#6fdc8c', // Green 30
  '#4589ff', // Blue 50
  '#d12771', // Magenta 60
  '#f1c21b', // Yellow 30
  '#08bdba', // Teal 40
  '#bae6ff', // Cyan 20
  '#ba4e00', // Orange 60
  '#d4bbff', // Purple 30
];

// Monochromatic sequential palettes — for trends and heatmaps
// Light theme: darkest = largest value
// Dark theme: lightest = largest value
export const CARBON_MONO_CYAN_LIGHT = ['#e5f6ff', '#bae6ff', '#82cfff', '#33b1ff', '#1192e8', '#0072c3', '#00539a', '#003a6d', '#012749', '#061727'];
export const CARBON_MONO_CYAN_DARK = ['#061727', '#012749', '#003a6d', '#00539a', '#0072c3', '#1192e8', '#33b1ff', '#82cfff', '#bae6ff', '#e5f6ff'];

export const CARBON_MONO_PURPLE_LIGHT = ['#f6f2ff', '#e8daff', '#d4bbff', '#be95ff', '#a56eff', '#8a3ffc', '#6929c4', '#491d8b', '#31135e', '#1c0f30'];
export const CARBON_MONO_PURPLE_DARK = ['#1c0f30', '#31135e', '#491d8b', '#6929c4', '#8a3ffc', '#a56eff', '#be95ff', '#d4bbff', '#e8daff', '#f6f2ff'];

export const CARBON_MONO_TEAL_LIGHT = ['#d9fbfb', '#9ef0f0', '#3ddbd9', '#08bdba', '#009d9a', '#007d79', '#005d5d', '#004144', '#022b30', '#081a1c'];
export const CARBON_MONO_TEAL_DARK = ['#081a1c', '#022b30', '#004144', '#005d5d', '#007d79', '#009d9a', '#08bdba', '#3ddbd9', '#9ef0f0', '#d9fbfb'];

// Carbon alert palette
export const CARBON_ALERT = {
  danger: '#da1e28', // Red 60
  warning: '#f1c21b', // Yellow 30
  caution: '#ff832b', // Orange 40
  success: '#198038', // Green 60
};

export const CARBON_ALERT_DARK = {
  danger: '#fa4d56', // Red 50
  warning: '#f1c21b', // Yellow 30
  caution: '#ff832b', // Orange 40
  success: '#42be65', // Green 40
};

// Alert colors used in component styling
export const ALERT_COLORS: Record<AlertLevel, { light: string; dark: string }> = {
  success: { light: '#198038', dark: '#42be65' },
  warning: { light: '#f1c21b', dark: '#f1c21b' },
  danger: { light: '#da1e28', dark: '#fa4d56' },
  neutral: { light: '#878d96', dark: '#a8a8a8' },
};

// Helper: get the right categorical palette based on theme
export function getCategoricalPalette(isDark: boolean): string[] {
  return isDark ? CARBON_CATEGORICAL_DARK : CARBON_CATEGORICAL_LIGHT;
}

// Helper: get monochromatic palette for sequential data
export function getSequentialPalette(isDark: boolean, hue: 'cyan' | 'purple' | 'teal' = 'cyan'): string[] {
  const map = {
    cyan: isDark ? CARBON_MONO_CYAN_DARK : CARBON_MONO_CYAN_LIGHT,
    purple: isDark ? CARBON_MONO_PURPLE_DARK : CARBON_MONO_PURPLE_LIGHT,
    teal: isDark ? CARBON_MONO_TEAL_DARK : CARBON_MONO_TEAL_LIGHT,
  };
  return map[hue];
}

// Helper: get alert color for theme
export function getAlertColorForTheme(level: AlertLevel, isDark: boolean): string {
  return ALERT_COLORS[level][isDark ? 'dark' : 'light'];
}
