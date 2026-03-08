import { ColumnInfo, ChartRecommendation, ChartType } from './types';

/**
 * Analyzes query result columns and data to recommend the best chart type.
 */
export function recommendChart(
    columns: ColumnInfo[],
    rows: Record<string, unknown>[],
    question: string
): ChartRecommendation {
    const dateColumns = columns.filter(c => c.isDate);
    const numericColumns = columns.filter(c => c.isNumeric);
    const categoricalColumns = columns.filter(c => c.isCategorical);
    const questionLower = question.toLowerCase();

    // Map visualization keywords
    const mapKeywords = ['country', 'countries', 'region', 'global', 'world', 'geographic', 'map', 'continent'];
    const wantsMap = mapKeywords.some(k => questionLower.includes(k)) &&
        columns.some(c => /country|region|state|province|continent/i.test(c.name));

    // Proportion keywords
    const proportionKeywords = ['proportion', 'percentage', 'share', 'distribution', 'breakdown', 'composition'];
    const wantsProportion = proportionKeywords.some(k => questionLower.includes(k));

    // Comparison keywords
    const comparisonKeywords = ['compare', 'comparison', 'versus', 'vs', 'top', 'highest', 'lowest', 'rank'];
    const wantsComparison = comparisonKeywords.some(k => questionLower.includes(k));

    // Trend keywords
    const trendKeywords = ['trend', 'over time', 'timeline', 'daily', 'weekly', 'monthly', 'growth', 'change'];
    const wantsTrend = trendKeywords.some(k => questionLower.includes(k));

    const uniqueCategories = categoricalColumns.length > 0
        ? new Set(rows.map(r => String(r[categoricalColumns[0].name]))).size
        : 0;

    // Decision tree
    let type: ChartType;
    let reasoning: string;

    if (wantsMap && numericColumns.length > 0) {
        type = 'map';
        reasoning = 'Geographic data detected — showing choropleth map for spatial visualization';
    } else if (dateColumns.length > 0 && numericColumns.length > 0 && (wantsTrend || !wantsComparison)) {
        if (numericColumns.length > 1 || categoricalColumns.length > 0) {
            type = 'line';
            reasoning = 'Time-series with multiple metrics — line chart shows trends clearly';
        } else {
            type = 'area';
            reasoning = 'Single time-series metric — area chart emphasizes magnitude over time';
        }
    } else if (wantsProportion && uniqueCategories > 1 && uniqueCategories <= 10) {
        type = 'pie';
        reasoning = 'Proportional breakdown with limited categories — pie chart shows distribution';
    } else if (categoricalColumns.length > 0 && numericColumns.length > 0) {
        if (numericColumns.length >= 2 && categoricalColumns.length >= 1) {
            type = 'scatter';
            reasoning = 'Two numeric dimensions with categories — scatter plot reveals correlations';
        } else if (uniqueCategories > 15) {
            type = 'bar';
            reasoning = 'Many categories to compare — horizontal bar chart for readability';
        } else {
            type = 'bar';
            reasoning = 'Categorical comparison — bar chart for clear ranking';
        }
    } else if (numericColumns.length >= 2) {
        type = 'scatter';
        reasoning = 'Multiple numeric columns — scatter plot to show relationships';
    } else if (rows.length > 50 && dateColumns.length > 0) {
        type = 'heatmap';
        reasoning = 'Dense time-series data — heatmap reveals intensity patterns';
    } else {
        type = 'table';
        reasoning = 'Data shape best suited for tabular display';
    }

    // Build axis recommendations
    const xAxis = dateColumns[0]?.name || categoricalColumns[0]?.name || columns[0]?.name;
    const yAxis = numericColumns.map(c => c.name);
    const series = categoricalColumns.length > 1 ? categoricalColumns[1]?.name :
        (categoricalColumns.length > 0 && dateColumns.length > 0 ? categoricalColumns[0]?.name : undefined);

    return {
        type,
        title: generateTitle(question, type),
        xAxis,
        yAxis: yAxis.length === 1 ? yAxis[0] : yAxis,
        series,
        reasoning,
    };
}

function generateTitle(question: string, chartType: ChartType): string {
    // Clean up question to use as title
    const cleaned = question
        .replace(/^(show|display|give|get|list|what|how|find|tell)\s+(me\s+)?(the\s+)?/i, '')
        .replace(/\?$/, '')
        .trim();

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Infer column types from data
 */
export function inferColumnTypes(
    columns: string[],
    rows: Record<string, unknown>[]
): ColumnInfo[] {
    return columns.map(name => {
        const sampleValues = rows
            .slice(0, Math.min(50, rows.length))
            .map(r => r[name])
            .filter(v => v != null && v !== '');

        const datePatterns = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{4}\/\d{2}\/\d{2})/;
        const dateColumnNames = /date|time|day|month|year|week|period/i;

        const isDate = dateColumnNames.test(name) ||
            sampleValues.some(v => typeof v === 'string' && datePatterns.test(v));

        const isNumeric = sampleValues.length > 0 &&
            sampleValues.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))));

        const uniqueRatio = new Set(sampleValues.map(String)).size / Math.max(sampleValues.length, 1);
        const isCategorical = !isNumeric && !isDate && uniqueRatio < 0.8 && sampleValues.length > 0;

        let type: ColumnInfo['type'] = 'string';
        if (isNumeric) type = 'number';
        if (isDate) type = 'date';

        return {
            name,
            type,
            isNumeric,
            isDate,
            isCategorical,
        };
    });
}
