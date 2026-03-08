import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD7H7cIm5jQ23Bh9GR7Zzu_1vbu2qnq1_U';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
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

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', errText);
            return NextResponse.json({ error: 'Gemini API failed', insights: [] }, { status: 502 });
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        // Extract JSON array from response (handle markdown fences)
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return NextResponse.json({ insights: [] });
        }

        const insights = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ insights });
    } catch (error) {
        console.error('AI Insights error:', error);
        return NextResponse.json({ error: 'Failed to generate insights', insights: [] }, { status: 500 });
    }
}
