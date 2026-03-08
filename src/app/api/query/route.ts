import { NextRequest, NextResponse } from 'next/server';
import { naturalLanguageToSQL } from '@/lib/nl-to-sql';
import { executeQuery } from '@/lib/snowflake';
import { inferColumnTypes } from '@/lib/chart-selector';
import { recommendChart } from '@/lib/chart-selector';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question } = body;

        if (!question || typeof question !== 'string') {
            return NextResponse.json(
                { error: 'A question is required' },
                { status: 400 }
            );
        }

        const startTime = Date.now();

        // Step 1: Convert NL to array of SQL queries (Dashboard Intents)
        const { panels, suggestedFollowUps } = await naturalLanguageToSQL(question);

        // Step 2: Execute all queries concurrently on Snowflake
        const processedPanels = await Promise.all(
            panels.map(async (panel, index) => {
                const panelStartTime = Date.now();
                try {
                    const { columns, rows } = await executeQuery(panel.sql);

                    // Step 3: Infer column types
                    const columnInfos = inferColumnTypes(columns, rows);

                    // Step 4: Recommend chart type
                    const chartRecommendation = recommendChart(columnInfos, rows, panel.title);

                    const executionTime = Date.now() - panelStartTime;

                    return {
                        id: `panel-${Date.now()}-${index}`,
                        title: panel.title,
                        sql: panel.sql,
                        columns: columnInfos,
                        rows: rows.slice(0, 500), // Cap at 500 rows for client
                        rowCount: rows.length,
                        executionTime,
                        chartRecommendation,
                        explanation: panel.explanation,
                    };
                } catch (err) {
                    console.error(`Failed to execute panel query '${panel.title}':`, err);
                    return null; // Return null so we can filter failed queries out, allowing the dashboard to partially render
                }
            })
        );

        // Step 5: Filter out any failed panels
        const validPanels = processedPanels.filter((p) => p !== null);

        if (validPanels.length === 0) {
            throw new Error('All dashboard queries failed to execute');
        }

        const totalExecutionTime = Date.now() - startTime;

        return NextResponse.json({
            panels: validPanels,
            suggestedFollowUps,
            totalExecutionTime,
        });
    } catch (error) {
        console.error('Query API error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
