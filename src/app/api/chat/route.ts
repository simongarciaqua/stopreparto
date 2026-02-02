import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages, systemPrompt, apiKey: clientApiKey } = await req.json();
        const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: { message: "GEMINI_API_KEY is not configured on the server or provided by client" } }, { status: 500 });
        }

        console.log("Using API Key starting with:", apiKey.substring(0, 10) + "...");

        const geminiContents = messages
            .filter((m: any) => m.role !== 'system')
            .map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: geminiContents,
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.7
                }
            })
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: { message: error.message || "Internal Server Error" } }, { status: 500 });
    }
}
