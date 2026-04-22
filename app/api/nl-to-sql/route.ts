import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: NextRequest) {
    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const { question, schema } = await req.json();

        if (!question || !schema) {
            return NextResponse.json({ error: 'Missing question or schema' }, { status: 400 });
        }

        const prompt = `You are a SQL expert assistant. Convert the following natural language question into a valid SQL query.

RULES:
- The table is called "data" (always use: SELECT ... FROM data ...)
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, CREATE, ALTER)
- Use standard SQL syntax compatible with AlaSQL (a JavaScript SQL engine)
- AlaSQL supports: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, JOIN, subqueries, aggregate functions (COUNT, SUM, AVG, MIN, MAX), DISTINCT, LIKE, IN, BETWEEN, CASE WHEN, aliases (AS)
- AlaSQL does NOT support: window functions (ROW_NUMBER, RANK, etc.), CTEs (WITH), FULL OUTER JOIN
- Use column names EXACTLY as they appear in the schema (they are case-sensitive)
- For string comparisons, use LIKE with % wildcards for partial matching
- Always add appropriate aggregations when the question implies summarization
- Use ORDER BY and LIMIT when the question asks for "top", "best", "highest", "lowest", etc.
- Respond with ONLY the SQL query. No markdown, no explanation, no code fences.

DATABASE SCHEMA:
${schema}

USER QUESTION:
${question}

SQL QUERY:`;

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'InsightBoard SQL Query',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.1,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter API error:', errText);
            return NextResponse.json({ error: 'AI API failed' }, { status: 502 });
        }

        const data = await response.json();
        let sql = data?.choices?.[0]?.message?.content || '';

        // Clean up: remove markdown fences, extra whitespace
        sql = sql.replace(/```sql/gi, '').replace(/```/g, '').trim();
        
        // Remove any leading/trailing quotes
        if ((sql.startsWith('"') && sql.endsWith('"')) || (sql.startsWith("'") && sql.endsWith("'"))) {
            sql = sql.slice(1, -1);
        }

        // Final safety check: ensure it starts with SELECT
        const firstWord = sql.split(/\s+/)[0]?.toUpperCase();
        if (firstWord !== 'SELECT') {
            return NextResponse.json({ error: 'Generated query is not a SELECT statement', sql }, { status: 400 });
        }

        return NextResponse.json({ sql });
    } catch (error) {
        console.error('NL-to-SQL error:', error);
        return NextResponse.json({ error: 'Failed to generate SQL' }, { status: 500 });
    }
}
