import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: NextRequest) {
    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'API key not configured', insights: [] }, { status: 500 });
        }

        const { dataSummary } = await req.json();

        if (!dataSummary) {
            return NextResponse.json({ error: 'No data summary provided' }, { status: 400 });
        }

        const prompt = `You are a data analyst AI assistant. Analyze the following dataset summary and provide 4-6 concise, actionable insights. Each insight should be a JSON object with:
- "text": A clear, concise insight (1-2 sentences max)
- "category": One of "trend", "outlier", "distribution", "correlation"
- "alertLevel": One of "success" (positive finding), "warning" (needs attention), "danger" (critical issue), "neutral" (informational)

Respond ONLY with a valid JSON array of insight objects. No markdown, no explanation.

Dataset Summary:
${dataSummary}`;

        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'InsightBoard Dashboard',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenRouter API error:', errText);
            return NextResponse.json({ error: 'OpenRouter API failed', insights: [] }, { status: 502 });
        }

        const data = await response.json();
        let rawText = data?.choices?.[0]?.message?.content || '[]';

        let insights = [];
        try {
            // Extract JSON from markdown fences if any
            rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

            const firstBracket = rawText.indexOf('[');
            const firstBrace = rawText.indexOf('{');

            if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
                const lastBracket = rawText.lastIndexOf(']');
                if (lastBracket !== -1) {
                    insights = JSON.parse(rawText.substring(firstBracket, lastBracket + 1));
                }
            } else if (firstBrace !== -1) {
                const lastBrace = rawText.lastIndexOf('}');
                if (lastBrace !== -1) {
                    const parsedObj = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
                    insights = Array.isArray(parsedObj.insights) ? parsedObj.insights : [];
                }
            }
        } catch (err) {
            console.error('Failed to parse OpenRouter API JSON:', err);
        }

        return NextResponse.json({ insights });
    } catch (error) {
        console.error('AI Insights error:', error);
        return NextResponse.json({ error: 'Failed to generate insights', insights: [] }, { status: 500 });
    }
}
