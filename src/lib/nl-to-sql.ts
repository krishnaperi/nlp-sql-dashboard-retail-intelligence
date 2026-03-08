import { GoogleGenAI } from '@google/genai';

const COVID_SCHEMA_CONTEXT = `
You are a SQL expert specializing in Snowflake and Covid-19 pandemic data analysis.

DATABASE: COVID19_EPIDEMIOLOGICAL_DATA
SCHEMA: PUBLIC

AVAILABLE TABLES AND THEIR KEY COLUMNS:

1. ECDC_GLOBAL - European CDC daily global data
   - COUNTRY_REGION (VARCHAR) - Country name
   - CONTINENTEXP (VARCHAR) - Continent
   - DATE (DATE) - Observation date
   - CASES (NUMBER) - Cumulative total cases
   - DEATHS (NUMBER) - Cumulative total deaths
   - CASES_SINCE_PREV_DAY (NUMBER) - Daily new cases
   - DEATHS_SINCE_PREV_DAY (NUMBER) - Daily new deaths
   - POPULATION (NUMBER) - Country population

2. JHU_COVID_19 - Johns Hopkins University tracking data
   - PROVINCE_STATE (VARCHAR), COUNTRY_REGION (VARCHAR)
   - DATE (DATE), CASE_TYPE (VARCHAR: 'Confirmed', 'Deaths', 'Active')
   - CASES (NUMBER), DIFFERENCE (NUMBER)
   - LATITUDE (NUMBER), LONGITUDE (NUMBER)

3. NYT_US_COVID19 - New York Times US state data
   - DATE (DATE), STATE (VARCHAR), FIPS (VARCHAR)
   - CASES (NUMBER), DEATHS (NUMBER)

4. OWID_VACCINATIONS - Our World in Data vaccination tracking
   - LOCATION (VARCHAR), ISO_CODE (VARCHAR)
   - DATE (DATE), TOTAL_VACCINATIONS (NUMBER)
   - PEOPLE_VACCINATED (NUMBER), PEOPLE_FULLY_VACCINATED (NUMBER)
   - DAILY_VACCINATIONS (NUMBER)

RULES:
- Always use fully qualified table names: COVID19_EPIDEMIOLOGICAL_DATA.PUBLIC.<TABLE_NAME>
- Use Snowflake SQL syntax (ILIKE for case-insensitive, :: for casting)
- Limit results to 500 rows max unless aggregated
- Use appropriate date formatting: TO_DATE(), DATE_TRUNC()
- For time series, ORDER BY DATE
- For rankings, use ORDER BY and LIMIT
- Never use DELETE, DROP, UPDATE, INSERT, ALTER, CREATE, GRANT
- Only generate SELECT statements
- Add helpful column aliases for readability
- COVID-19 datasets often contain negative daily counts due to historical corrections. When querying daily metrics (e.g., CASES_SINCE_PREV_DAY, DIFFERENCE), ALWAYS wrap them in GREATEST(0, <column>) to prevent negative spikes in visualizations, or filter them out with WHERE <column> >= 0.
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${COVID_SCHEMA_CONTEXT}

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
    },
    ...
  ],
  "suggestedFollowUps": ["Follow up 1?", "Follow up 2?", "Follow up 3?"]
}

Generate Snowflake SQL queries that are efficient and return meaningful results for visualizations.`,
    });

    const text = response.text?.trim() || '';

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
