import Groq from 'groq-sdk';

const RETAIL_SCHEMA_CONTEXT = `
You are a SQL expert specializing in Snowflake and e-commerce/retail product demand analysis.

DATABASE: (dynamically provided by session)
SCHEMA: (dynamically provided by session)

AVAILABLE TABLES CATEGORIZED BY DATA TYPE:

1. SEARCH TERMS & KEYWORDS
   - ON_SITE_SEARCH (Daily records):
     - COUNTRY (NUMBER): Country identifier code
     - OSS_KEYWORD (VARCHAR): The actual search keyword typed by the user on the site
     - CALIBRATED_USERS (FLOAT): The estimated number of unique users searching this keyword
     - CALIBRATED_VISITS (FLOAT): The estimated number of site visits associated with this keyword
     - SITE_RULE (VARCHAR): The domain/retailer where the search occurred (e.g., 'amazon.com', 'walmart.com')
     - DATE (DATE): The date of the search metrics

RULES:
- ONLY query the \`ON_SITE_SEARCH\` table. Do NOT hallucinate other tables.
- Do NOT use fully qualified table names (e.g., avoid DB.SCHEMA.TABLE). Use unqualified table names directly (e.g., SELECT * FROM ON_SITE_SEARCH) as the session already has the correct default database and schema configured.
- To analyze "search volume" or "demand," aggregate \`CALIBRATED_VISITS\` or \`CALIBRATED_USERS\`.
- To analyze "market share" or "domain performance," group by \`SITE_RULE\`.
- To see "trending keywords," aggregate \`CALIBRATED_VISITS\` by \`OSS_KEYWORD\`.
- Use Snowflake SQL syntax (ILIKE for case-insensitive, :: for casting)
- Limit results to 500 rows max unless aggregated
- Use appropriate date formatting: TO_DATE(), DATE_TRUNC()
- For time series, ORDER BY DATE
- For rankings, use ORDER BY ... DESC NULLS LAST and LIMIT
- Use appropriate window functions for growth momentum calculations if needed.
`;

interface DashboardIntent {
    title: string;
    sql: string;
    explanation: string;
}

export async function naturalLanguageToSQL(question: string): Promise<{
    panels: DashboardIntent[];
    suggestedFollowUps: string[];
}> {
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY; // Allow backwards compatibility if they named it GEMINI
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    const groq = new Groq({ apiKey });

    const promptText = `${RETAIL_SCHEMA_CONTEXT}

USER QUESTION: "${question}"

You are a Data Analyst Agent. For the user's question, break down the intent into a comprehensive dashboard with 2 to 4 distinct but related charts.
- The first chart should directly answer the core question.
- Subsequent charts should provide broader context (e.g., trend over time, comparison with neighbors, breakdowns, correlations).
- Also provide exactly 3 "suggested follow-up" questions the user could ask next to dive deeper.

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "panels": [
    {
      "title": "Clear UI Title for Chart 1",
      "sql": "SELECT ...",
      "explanation": "Brief reasoning for this chart"
    }
  ],
  "suggestedFollowUps": ["Follow up 1?", "Follow up 2?", "Follow up 3?"]
}

Generate Snowflake SQL queries that are efficient and return meaningful results for visualizations.`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content?.trim() || '';

    // Parse JSON response, handling potential markdown code fences
    let cleaned = text;
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);

        // Security validation & Fallback
        if (!parsed.panels || !Array.isArray(parsed.panels)) {
            throw new Error('Invalid JSON format: missing panels array');
        }

        const validPanels: DashboardIntent[] = [];
        for (const panel of parsed.panels) {
            if (panel.sql) {
                const sqlUpper = panel.sql.trim().toUpperCase();
                if (sqlUpper.startsWith('SELECT') || sqlUpper.startsWith('WITH')) {
                    validPanels.push(panel as DashboardIntent);
                }
            }
        }

        if (validPanels.length === 0) {
            throw new Error('No valid SELECT queries found in response');
        }

        return {
            panels: validPanels,
            suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
                ? parsed.suggestedFollowUps.slice(0, 3)
                : [],
        };
    } catch (parseErr) {
        // Fallback: try to extract a single SQL statement from text
        const sqlMatch = text.match(/SELECT[\s\S]+?;?$/im);
        if (sqlMatch) {
            return {
                panels: [{
                    title: 'Analysis Result',
                    sql: sqlMatch[0],
                    explanation: 'Generated SQL query for: ' + question,
                }],
                suggestedFollowUps: ['Show trend over time', 'Break down by region', 'Show correlation']
            };
        }
        throw new Error('Failed to generate valid SQL from the question');
    }
}
