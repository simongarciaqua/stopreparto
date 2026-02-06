import { NextResponse } from 'next/server';
import { buildOrchestratorPrompt } from '@/lib/agents/orchestrator';
import { buildSystemPrompt as buildStopPrompt } from '@/lib/agents/stop-reparto/logic';
import { buildSystemPrompt as buildAvisoPrompt } from '@/lib/agents/aviso-urgente/logic';
import { INITIAL_API_MOCKS } from '@/lib/mocks';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type TalkdeskRequest = {
    message: string;
    sessionId?: string;
    agent?: 'STOP_REPARTO' | 'AVISO_URGENTE' | 'ORCHESTRATOR';
};

async function callGemini(messages: any[], systemPrompt: string) {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const geminiContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: geminiContents,
            system_instruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.7 }
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Gemini API Error");
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Support both direct format and Talkdesk interaction format if needed
        const userMessage = body.message || body.interaction?.message?.text || "Hola";
        let activeAgent = body.agent || 'ORCHESTRATOR';

        console.log(`[Talkdesk API] Received: "${userMessage}" | Agent: ${activeAgent}`);

        let systemPrompt = "";
        let finalResponse = "";

        // 1. Orchestration if needed
        if (activeAgent === 'ORCHESTRATOR') {
            const orchestratorPrompt = buildOrchestratorPrompt();
            const orchestratorRes = await callGemini([{ role: 'user', content: userMessage }], orchestratorPrompt);

            try {
                const cleanContent = (orchestratorRes || "").replace(/```json/g, '').replace(/```/g, '').trim();
                const routing = JSON.parse(cleanContent);

                if (routing.target_agent && routing.target_agent !== 'UNKNOWN') {
                    activeAgent = routing.target_agent;
                    console.log(`[Talkdesk API] Orchestrator routed to: ${activeAgent}`);
                }
            } catch (e) {
                console.error("Orchestrator parse error", e);
            }
        }

        // 2. Prepare Agent Prompt
        if (activeAgent === 'STOP_REPARTO') {
            systemPrompt = buildStopPrompt(INITIAL_API_MOCKS);
        } else if (activeAgent === 'AVISO_URGENTE') {
            systemPrompt = buildAvisoPrompt(INITIAL_API_MOCKS);
        } else {
            // Fallback
            return NextResponse.json({
                text: "Lo siento, no he podido identificar si quieres gestionar un reparto o dejar un aviso urgente. ¿Me puedes dar más detalles?",
                agent: 'ORCHESTRATOR'
            });
        }

        // 3. Call Final Agent
        finalResponse = await callGemini([{ role: 'user', content: userMessage }], systemPrompt);

        // 4. Return in Talkdesk-friendly format
        // Talkdesk often expects a simple "text" field or custom JSON
        return NextResponse.json({
            text: finalResponse.replace(/\[\[ACTION:.*?\]\]/g, '').trim(),
            raw_response: finalResponse,
            agent: activeAgent,
            // If there's an action, we could signal it here
            has_action: finalResponse.includes('[[ACTION:'),
            action: finalResponse.match(/\[\[ACTION:(.*?)\]\]/)?.[1]
        });

    } catch (error: any) {
        console.error("Talkdesk Bridge Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
