'use client';

import React, { useState } from 'react';
import { CustomerStatePanel } from '@/components/CustomerStatePanel';
import { ApiMocksPanel } from '@/components/ApiMocksPanel';
import { ChatInterface } from '@/components/ChatInterface';
import { buildSystemPrompt as buildStopPrompt } from '@/lib/agents/stop-reparto/logic';
import { buildSystemPrompt as buildAvisoPrompt } from '@/lib/agents/aviso-urgente/logic';
import { buildOrchestratorPrompt } from '@/lib/agents/orchestrator';
import { CustomerState, ApiMocks, Message, ActiveProcess } from '@/lib/types';
import { INITIAL_API_MOCKS } from '@/lib/mocks';


// Initial Data
const initialCustomerState: CustomerState = {
    hasActiveStop: false,
    canRequestStopDelivery: true,
    canCancelStop: false,
    selectedReason: 'agua_acumulada',
    simulatedInconsistency: false,
    activeProcess: 'ORCHESTRATOR'
};

const initialApiMocks: ApiMocks = INITIAL_API_MOCKS;


export default function Home() {
    const [activeProcess, setActiveProcess] = useState<ActiveProcess>('ORCHESTRATOR');
    const [apiMocks, setApiMocks] = useState<ApiMocks>(initialApiMocks);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiKey, setApiKey] = useState('');

    const handleSendMessage = async (content: string, apiKey: string, ignoreHistory = false) => {
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        const currentMessages = ignoreHistory ? [newUserMsg] : [...messages, newUserMsg];
        if (!ignoreHistory) setMessages(currentMessages);
        setIsProcessing(true);

        try {
            // STEP 1: Determine System Prompt based on Active Process
            let systemPrompt = "";
            let currentProcess = activeProcess;

            if (currentProcess === 'ORCHESTRATOR') {
                systemPrompt = buildOrchestratorPrompt();
            } else if (currentProcess === 'STOP_REPARTO') {
                systemPrompt = buildStopPrompt(apiMocks);
            } else if (currentProcess === 'AVISO_URGENTE') {
                systemPrompt = buildAvisoPrompt(apiMocks);
            }

            // Call to LLM
            const response = await fetch('/api/chat', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: currentMessages,
                    systemPrompt: systemPrompt,
                    apiKey: apiKey,
                    // We only enforce JSON mode for the Orchestrator to ensure clean routing
                    jsonMode: currentProcess === 'ORCHESTRATOR'
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message || "Unknown error from Gemini API");

            let agentContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!agentContent) throw new Error("No content returned from Gemini");

            // STEP 2: Handle Orchestrator Logic
            if (currentProcess === 'ORCHESTRATOR') {
                try {
                    // Clean up potential markdown blocks if JSON mode wasn't perfect
                    const cleanContent = agentContent.replace(/```json/g, '').replace(/```/g, '').trim();
                    const routing = JSON.parse(cleanContent);

                    if (routing.target_agent && routing.target_agent !== 'UNKNOWN') {
                        // Switch process and RE-RUN the same user message with the new agent
                        setActiveProcess(routing.target_agent);

                        const targetAgent = routing.target_agent;
                        const newSystemPrompt = targetAgent === 'STOP_REPARTO'
                            ? buildStopPrompt(apiMocks)
                            : buildAvisoPrompt(apiMocks);

                        // Add a small system message indicating transfer
                        const transferMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            role: 'system',
                            content: `🔄 Derivando a agente especializado: ${targetAgent}...`,
                            timestamp: Date.now() + 1
                        };
                        setMessages(prev => [...prev, transferMsg]);

                        // Recursive Call (Manual for simplicity)
                        const response2 = await fetch('/api/chat', {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                messages: currentMessages,
                                systemPrompt: newSystemPrompt,
                                apiKey: apiKey
                            })
                        });
                        const data2 = await response2.json();
                        agentContent = data2.candidates?.[0]?.content?.parts?.[0]?.text;
                        currentProcess = targetAgent; // Update local ref for action parsing
                    } else {
                        // Default fallback
                        agentContent = "Disculpa, no entendí si quieres pausar tu reparto o hacer un pedido urgente. ¿Podrías aclararlo?";
                    }
                } catch (e) {
                    console.error("Orchestrator JSON parse error", e);
                    // Fallback if not JSON
                    agentContent = "No estoy seguro de cómo ayudarte con eso. ¿Es sobre Stop Reparto o Pedido Urgente?";
                }
            }

            // STEP 3: Handle Agent Actions
            // The regex now supports simple alphanum params OR JSON objects starting with {
            const actionRegex = /\[\[ACTION:([A-Z_]+)(?::([a-z0-9_]+|{.*}))?\]\]/;
            const match = agentContent.match(actionRegex);
            let systemActionMsg: Message | null = null;

            if (match) {
                // Remove the action tag from the displayed message
                agentContent = agentContent.replace(match[0], '').trim();

                const actionType = match[1];
                const actionParam = match[2];

                // EXECUTE ACTIONS
                if (actionType === 'CANCEL_STOP') {
                    setApiMocks(prev => ({
                        ...prev,
                        stop_delivery: { ...prev.stop_delivery, requested: false, enabled: true },
                        get_support_stop_delivery: { ...prev.get_support_stop_delivery, requested: false, can_cancel: false },
                        post_support_stop_delivery_cancel: { success: { message: "Simulación: Stop Cancelado OK" } }
                    }));
                    systemActionMsg = { id: (Date.now() + 2).toString(), role: 'system', content: `[API] POST /stop-delivery/cancel\n✅ 200 OK`, timestamp: Date.now() + 2 };
                }
                else if (actionType === 'CREATE_STOP') {
                    setApiMocks(prev => ({
                        ...prev,
                        stop_delivery: { ...prev.stop_delivery, requested: true, enabled: true },
                        get_support_stop_delivery: { ...prev.get_support_stop_delivery, requested: true, can_cancel: true },
                        post_support_stop_delivery_request: { success: { message: `Simulación: Stop Solicitado (${actionParam})` } }
                    }));
                    systemActionMsg = { id: (Date.now() + 2).toString(), role: 'system', content: `[API] POST /stop-delivery/request\n📦 Option: ${actionParam}\n✅ 200 OK`, timestamp: Date.now() + 2 };
                }
                else if (actionType === 'ORDER_URGENT_DELIVERY') {
                    // Parse the JSON payload for the order
                    let orderPayload = "Error parsing JSON";
                    try {
                        const parsedOrder = JSON.parse(actionParam || "{}");
                        orderPayload = JSON.stringify(parsedOrder, null, 2);

                        // Update mocks to show active order
                        setApiMocks(prev => ({
                            ...prev,
                            delivery_info: {
                                ...prev.delivery_info!,
                                current_order: {
                                    documentNumber: "99988877",
                                    documentDate: new Date().toISOString().split('T')[0],
                                    products: parsedOrder.products || []
                                }
                            }
                        }));

                        systemActionMsg = {
                            id: (Date.now() + 2).toString(),
                            role: 'system',
                            content: `[API] POST /delivery/urgent\n📦 Body: \n${orderPayload}\n✅ 200 OK`,
                            timestamp: Date.now() + 2
                        };
                    } catch (e) {
                        systemActionMsg = { id: (Date.now() + 2).toString(), role: 'system', content: `[API] Invalid JSON Action: ${actionParam}`, timestamp: Date.now() + 2 };
                    }
                }
            }

            const newAgentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: agentContent,
                timestamp: Date.now()
            };

            if (ignoreHistory) {
                setMessages([newUserMsg, newAgentMsg]);
            } else {
                setMessages(prev => {
                    const newHistory = [...prev, newAgentMsg];
                    if (systemActionMsg) newHistory.push(systemActionMsg);
                    return newHistory;
                });
            }

        } catch (error: any) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: `Error: ${error.message}`,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsProcessing(false);
        }
    };

    const getBorderColor = () => {
        switch (activeProcess) {
            case 'STOP_REPARTO': return 'border-red-500';
            case 'AVISO_URGENTE': return 'border-orange-500';
            default: return 'border-gray-100';
        }
    };

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden text-sm">

            {/* Left Column: Context / API Controller */}
            <div className={`w-[300px] flex-shrink-0 border-r flex flex-col z-20 transition-colors duration-300 ${getBorderColor()}`}>
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-gray-700">Estado del Cliente</h2>
                    <div className="mt-2 text-xs">
                        <span className="font-semibold">Agente Activo:</span>
                        <select
                            value={activeProcess}
                            onChange={(e) => setActiveProcess(e.target.value as ActiveProcess)}
                            className="ml-2 p-1 border rounded"
                        >
                            <option value="ORCHESTRATOR">Orquestador (Auto)</option>
                            <option value="STOP_REPARTO">Simular: Stop Reparto</option>
                            <option value="AVISO_URGENTE">Simular: Reparto Urgente</option>
                        </select>
                    </div>
                </div>
                <CustomerStatePanel
                    mocks={apiMocks}
                    activeProcess={activeProcess}
                    onChangeMocks={setApiMocks}
                    onReevaluate={() => {
                        if (messages.length > 0) {
                            const lastUserText = [...messages].reverse().find(m => m.role === 'user')?.content || "Hola";
                            handleSendMessage(lastUserText, apiKey, true);
                        } else {
                            handleSendMessage("Evalúa mi estado actual", apiKey, true);
                        }
                    }}
                />
            </div>

            {/* Middle Column: Chat */}
            <div className="flex-1 flex flex-col min-w-0 z-10 bg-white">
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onResetChat={() => {
                        setMessages([]);
                        setActiveProcess('ORCHESTRATOR');
                    }}
                    isProcessing={isProcessing}
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                />
            </div>

            {/* Right Column: Logs */}
            <div className="w-[450px] flex-shrink-0 border-l border-gray-100 flex flex-col bg-slate-50 z-20">
                <ApiMocksPanel
                    mocks={apiMocks}
                    activeProcess={activeProcess}
                    onChange={setApiMocks}
                />
            </div>

        </div>
    );
}
