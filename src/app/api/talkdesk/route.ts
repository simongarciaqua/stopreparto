
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

        // Support multiple input formats:
        // 1. Direct:   { message: "..." }
        // 2. Kore.ai playground: { messages: { reason: "..." }, tools: {} }
        // 3. Kore.ai array format: { messages: [{role: "user", content: "..."}] }
        // 4. Talkdesk: { interaction: { message: { text: "..." } } }
        let userMessage: string = "Hola";
        if (typeof body.message === 'string') {
            userMessage = body.message;
        } else if (typeof body.reason === 'string') {
            userMessage = body.reason;
        } else if (body.messages) {
            if (typeof body.messages === 'string') {
                userMessage = body.messages;
            } else if (typeof body.messages?.reason === 'string') {
                // Kore.ai playground format: { messages: { reason: "..." } }
                userMessage = body.messages.reason;
            } else if (Array.isArray(body.messages) && body.messages.length > 0) {
                // Array of message objects
                const last = body.messages[body.messages.length - 1];
                userMessage = last?.content || last?.text || last?.message || "Hola";
            }
        } else if (body.interaction?.message?.text) {
            userMessage = body.interaction.message.text;
        }

        let activeAgent = body.agent || 'ORCHESTRATOR';

        console.log(`[Talkdesk API] Raw body:`, JSON.stringify(body));
        console.log(`[Talkdesk API] Resolved message: "${userMessage}" | Agent: ${activeAgent}`);

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
            return Response.json({
                text: "Lo siento, no he podido identificar si quieres gestionar un reparto o dejar un aviso urgente. ¿Me puedes dar más detalles?"
            });
        }

        // 3. Call Final Agent
        finalResponse = await callGemini([{ role: 'user', content: userMessage }], systemPrompt);

        // 4. Return in Talkdesk-friendly format
        // Talkdesk often expects a simple "text" field or custom JSON
        return Response.json({
            text: finalResponse.replace(/\[\[ACTION:.*?\]\]/g, '').trim()
        });

    } catch (error: any) {
        console.error("Talkdesk Bridge Error:", error);
        return Response.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
