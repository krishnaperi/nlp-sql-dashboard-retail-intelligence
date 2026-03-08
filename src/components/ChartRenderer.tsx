'use client';

import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import {
    LineChart,
    BarChart,
    PieChart,
    ScatterChart,
    HeatmapChart,
    MapChart,
} from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent,
    ToolboxComponent,
    VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { DashboardPanel, ChartType } from '@/lib/types';

// Register ECharts components
echarts.use([
    LineChart, BarChart, PieChart, ScatterChart, HeatmapChart, MapChart,
    TitleComponent, TooltipComponent, GridComponent, LegendComponent,
    DataZoomComponent, ToolboxComponent, VisualMapComponent,
    CanvasRenderer,
]);

interface ChartRendererProps {
    result: DashboardPanel;
}

// Premium color palette
const COLORS = [
    '#29b6f6', // Snowflake cyan
    '#ef5350', // Coral red
    '#66bb6a', // Emerald green
    '#ffa726', // Amber
    '#ab47bc', // Violet
    '#26c6da', // Teal
    '#ec407a', // Pink
    '#42a5f5', // Blue
    '#8d6e63', // Brown
    '#78909c', // Slate
];

export default function ChartRenderer({ result }: ChartRendererProps) {
    const { chartRecommendation, columns, rows } = result;

    const option = useMemo(() => {
        return buildChartOption(chartRecommendation.type, columns, rows, chartRecommendation);
    }, [chartRecommendation, columns, rows]);

    if (!option) {
        if (chartRecommendation.type === 'table') {
            return (
                <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <p style={{ color: '#c8d6e5', fontSize: '16px' }}>This data is best viewed in the raw data table below.</p>
                </div>
            );
        }
        return <div className="chart-error">Unable to generate visualization for this data.</div>;
    }

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">{chartRecommendation.title}</h3>
                <span className="chart-type-badge">{chartRecommendation.type.toUpperCase()}</span>
            </div>
            <p className="chart-reasoning">{chartRecommendation.reasoning}</p>
            <ReactEChartsCore
                echarts={echarts}
                option={option}
                style={{ height: '450px', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}

function buildChartOption(
    type: ChartType,
    columns: DashboardPanel['columns'],
    rows: DashboardPanel['rows'],
    rec: DashboardPanel['chartRecommendation']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const baseTheme = {
        backgroundColor: 'transparent',
        textStyle: { color: '#c8d6e5', fontFamily: "'Inter', sans-serif" },
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut' as const,
    };

    const tooltip = {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(41, 182, 246, 0.3)',
        textStyle: { color: '#e2e8f0', fontSize: 13 },
        axisPointer: { type: 'cross' as const, crossStyle: { color: '#999' } },
    };

    const toolbox = {
        show: true,
        feature: {
            saveAsImage: { title: 'Save', iconStyle: { borderColor: '#c8d6e5' } },
            dataZoom: { title: { zoom: 'Zoom', back: 'Reset' } },
            restore: { title: 'Restore' },
        },
        iconStyle: { borderColor: '#c8d6e5' },
        right: 20,
        top: 10,
    };

    const xAxisName = rec.xAxis || columns[0]?.name;
    const yAxisNames = Array.isArray(rec.yAxis) ? rec.yAxis : rec.yAxis ? [rec.yAxis] : columns.filter(c => c.isNumeric).map(c => c.name);

    switch (type) {
        case 'line':
        case 'area': {
            const seriesColName = rec.series;
            if (seriesColName && xAxisName) {
                // Grouped series
                const groups = groupByColumn(rows, seriesColName);
                const allXValues = [...new Set(rows.map(r => String(r[xAxisName])))];
                const series = Object.entries(groups).slice(0, 10).map(([name, groupRows], i) => ({
                    name,
                    type: 'line' as const,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 4,
                    areaStyle: type === 'area' ? { opacity: 0.15 } : undefined,
                    lineStyle: { width: 2.5 },
                    data: allXValues.map(x => {
                        const match = groupRows.find(r => String(r[xAxisName]) === x);
                        return match ? Number(match[yAxisNames[0]]) : null;
                    }),
                    itemStyle: { color: COLORS[i % COLORS.length] },
                }));
                return {
                    ...baseTheme, tooltip, toolbox,
                    legend: { data: series.map(s => s.name), textStyle: { color: '#c8d6e5' }, bottom: 0 },
                    grid: { left: 60, right: 40, top: 60, bottom: 60 },
                    xAxis: { type: 'category', data: allXValues, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: allXValues.length > 20 ? 45 : 0 } },
                    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }, axisLabel: { color: '#94a3b8' } },
                    dataZoom: [{ type: 'slider', bottom: 30, height: 20, borderColor: 'transparent', backgroundColor: 'rgba(41, 182, 246, 0.05)', fillerColor: 'rgba(41, 182, 246, 0.15)' }],
                    series,
                };
            }
            // Simple line
            return {
                ...baseTheme, tooltip, toolbox,
                grid: { left: 60, right: 40, top: 40, bottom: 60 },
                xAxis: { type: 'category', data: rows.map(r => String(r[xAxisName!])), axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: rows.length > 20 ? 45 : 0 } },
                yAxis: yAxisNames.map((name, i) => ({ type: 'value', name, nameTextStyle: { color: '#94a3b8' }, position: i === 0 ? 'left' : 'right', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: i === 0 ? 'rgba(51, 65, 85, 0.4)' : 'transparent' } }, axisLabel: { color: '#94a3b8' } })),
                dataZoom: [{ type: 'slider', bottom: 30, height: 20, borderColor: 'transparent', backgroundColor: 'rgba(41, 182, 246, 0.05)', fillerColor: 'rgba(41, 182, 246, 0.15)' }],
                series: yAxisNames.map((name, i) => ({
                    name, type: 'line' as const, smooth: true, symbol: 'circle', symbolSize: 4,
                    areaStyle: type === 'area' ? { opacity: 0.15 } : undefined,
                    lineStyle: { width: 2.5 }, yAxisIndex: Math.min(i, 1),
                    data: rows.map(r => Number(r[name])),
                    itemStyle: { color: COLORS[i % COLORS.length] },
                })),
                legend: yAxisNames.length > 1 ? { data: yAxisNames, textStyle: { color: '#c8d6e5' }, bottom: 0 } : undefined,
            };
        }

        case 'bar':
        case 'map':
        case 'heatmap':
        case 'radar':
        case 'treemap': {
            // Fallback for types not fully implemented with custom renderers yet
            const yAxisNamesToUse = yAxisNames.length > 0 ? yAxisNames : [columns.filter(c => c.isNumeric)[0]?.name].filter(Boolean) as string[];
            if (yAxisNamesToUse.length === 0) return null;

            const xData = rows.map(r => String(r[xAxisName!] || ''));
            return {
                ...baseTheme, tooltip: { ...tooltip, trigger: 'axis' }, toolbox,
                grid: { left: xData.some(x => x.length > 10) ? 140 : 60, right: 40, top: 40, bottom: 40 },
                xAxis: xData.length > 10
                    ? { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }, axisLabel: { color: '#94a3b8' } }
                    : { type: 'category', data: xData, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: xData.length > 8 ? 45 : 0 } },
                yAxis: xData.length > 10
                    ? { type: 'category', data: xData, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8' } }
                    : { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }, axisLabel: { color: '#94a3b8' } },
                series: yAxisNamesToUse.map((name, i) => ({
                    name, type: 'bar' as const,
                    data: rows.map(r => Number(r[name] || 0)),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(xData.length > 10 ? 1 : 0, 0, 0, xData.length > 10 ? 0 : 1, [
                            { offset: 0, color: COLORS[i % COLORS.length] },
                            { offset: 1, color: adjustColor(COLORS[i % COLORS.length], -40) },
                        ]),
                        borderRadius: xData.length > 10 ? [0, 4, 4, 0] : [4, 4, 0, 0],
                    },
                    barMaxWidth: 40,
                })),
                legend: yAxisNamesToUse.length > 1 ? { data: yAxisNamesToUse, textStyle: { color: '#c8d6e5' }, top: 0 } : undefined,
            };
        }

        case 'pie': {
            const pieData = rows.slice(0, 15).map((r, i) => ({
                name: String(r[xAxisName!] || ''),
                value: Number(r[yAxisNames[0]] || 0),
                itemStyle: { color: COLORS[i % COLORS.length] },
            }));
            return {
                ...baseTheme, toolbox,
                tooltip: { trigger: 'item', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(41, 182, 246, 0.3)', textStyle: { color: '#e2e8f0' }, formatter: '{b}: {c} ({d}%)' },
                legend: { orient: 'vertical', right: 20, top: 'center', textStyle: { color: '#c8d6e5' } },
                series: [{
                    type: 'pie', radius: ['35%', '65%'], center: ['40%', '50%'],
                    avoidLabelOverlap: true,
                    itemStyle: { borderRadius: 8, borderColor: '#0a0e1a', borderWidth: 2 },
                    label: { show: true, color: '#94a3b8', formatter: '{b}\n{d}%' },
                    emphasis: {
                        label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#fff' },
                        itemStyle: { shadowBlur: 20, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
                    },
                    data: pieData,
                    animationType: 'scale',
                    animationEasing: 'elasticOut',
                }],
            };
        }

        case 'scatter': {
            const y1 = yAxisNames[0];
            const y2 = yAxisNames[1] || yAxisNames[0];
            if (!y1) return null;
            return {
                ...baseTheme, tooltip: { ...tooltip, trigger: 'item' }, toolbox,
                grid: { left: 60, right: 40, top: 40, bottom: 60 },
                xAxis: { type: 'value', name: y1, nameTextStyle: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }, axisLabel: { color: '#94a3b8' } },
                yAxis: { type: 'value', name: y2, nameTextStyle: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }, axisLabel: { color: '#94a3b8' } },
                series: [{
                    type: 'scatter', symbolSize: 12,
                    data: rows.map(r => [Number(r[y1] || 0), Number(r[y2] || 0)]),
                    itemStyle: { color: COLORS[0], shadowBlur: 8, shadowColor: 'rgba(41, 182, 246, 0.3)' },
                    emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(41, 182, 246, 0.6)' } },
                }],
            };
        }

        case 'table':
            // Table implies no chart, but we return a minimal option to avoid the error state,
            // or we return null and handle 'table' specifically in the parent.
            // Returning null is fine if the parent handles it.
            return null;

        default:
            return null;
    }
}

function groupByColumn(rows: Record<string, unknown>[], colName: string): Record<string, Record<string, unknown>[]> {
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const row of rows) {
        const key = String(row[colName]);
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
    }
    return groups;
}

function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
