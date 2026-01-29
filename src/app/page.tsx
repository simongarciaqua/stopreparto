'use client';

import React, { useState } from 'react';
import { CustomerStatePanel } from '@/components/CustomerStatePanel';
import { ApiMocksPanel } from '@/components/ApiMocksPanel';
import { ChatInterface } from '@/components/ChatInterface';
import { buildSystemPrompt } from '@/lib/agent-logic';
import { CustomerState, ApiMocks, Message } from '@/lib/types';

// Initial Data
const initialCustomerState: CustomerState = {
    hasActiveStop: false,
    canRequestStopDelivery: true,
    canCancelStop: false,
    selectedReason: 'agua_acumulada',
    simulatedInconsistency: false
};

const initialApiMocks: ApiMocks = {
    stop_delivery: {
        enabled: true,
        requested: false
    },
    get_support_stop_delivery: {
        can_request_stop_delivery: true,
        requested: false,
        can_cancel: false,
        anticipated_next_delivery_date: "2026-02-15",
        next_delivery_date: "2026-02-22", // Default value
        faq_url: "https://example.com/faq",
        has_pending_invoices: false,
        cannot_request_more_contact_phone: "900 123 456",
        options: [
            {
                id: "plan_completo",
                title: "Plan completo",
                description: "Seguimos facturando tu plan habitual y las botellas se acumulan en tu saldo.",
                enabled: true
            },
            {
                id: "cuota_minima",
                title: "Cuota mínima",
                description: "Pausas el servicio sin recibir botellas y se aplica una cuota mínima de <strong>4,90 €</strong>.",
                enabled: true
            }
        ]
    },
    post_support_stop_delivery_request: {
        success: {
            message: "Stop solicitado correctamente"
        }
    },
    post_support_stop_delivery_cancel: {
        success: {
            message: "Stop cancelado correctamente"
        }
    }
};

export default function Home() {
    // const [customerState, setCustomerState] = useState<CustomerState>(initialCustomerState); // REMOVED
    const [apiMocks, setApiMocks] = useState<ApiMocks>(initialApiMocks);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Agent Logic Integration
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
            // Updated: Direct call to buildSystemPrompt (No Orchestrator)
            const systemPrompt = buildSystemPrompt(apiMocks);

            const geminiContents = currentMessages
                .filter(m => m.role !== 'system')
                .map(m => ({
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

            if (data.error) {
                throw new Error(data.error.message || "Unknown error from Gemini API");
            }

            let agentContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!agentContent) {
                throw new Error("No content returned from Gemini");
            }

            // ACTION PARSE LOGIC
            const actionRegex = /\[\[ACTION:([A-Z_]+)(?::([a-z0-9_]+))?\]\]/;
            const match = agentContent.match(actionRegex);
            let systemActionMsg: Message | null = null;

            if (match) {
                // Remove the action tag from the displayed message
                agentContent = agentContent.replace(match[0], '').trim();

                const actionType = match[1];
                const actionParam = match[2];

                // EXECUTE ACTION (Simulate Backend)
                if (actionType === 'CANCEL_STOP') {
                    setApiMocks(prev => ({
                        ...prev,
                        stop_delivery: { ...prev.stop_delivery, requested: false, enabled: true },
                        get_support_stop_delivery: { ...prev.get_support_stop_delivery, requested: false, can_cancel: false },
                        post_support_stop_delivery_cancel: { success: { message: "Simulación: Stop Cancelado OK" } }
                    }));
                    // setCustomerState(prev => ({ ...prev, hasActiveStop: false, canCancelStop: false })); // REMOVED

                    systemActionMsg = {
                        id: (Date.now() + 2).toString(),
                        role: 'system',
                        content: `[API] POST /support/stop-delivery/cancel\n✅ 200 OK`,
                        timestamp: Date.now() + 2
                    };
                } else if (actionType === 'CREATE_STOP') {
                    setApiMocks(prev => ({
                        ...prev,
                        stop_delivery: { ...prev.stop_delivery, requested: true, enabled: true },
                        get_support_stop_delivery: { ...prev.get_support_stop_delivery, requested: true, can_cancel: true },
                        post_support_stop_delivery_request: { success: { message: `Simulación: Stop Solicitado (${actionParam})` } }
                    }));
                    // setCustomerState(prev => ({ ...prev, hasActiveStop: true, canCancelStop: true })); // REMOVED

                    systemActionMsg = {
                        id: (Date.now() + 2).toString(),
                        role: 'system',
                        content: `[API] POST /support/stop-delivery/request\n📦 Body: { option_id: "${actionParam}" }\n✅ 200 OK`,
                        timestamp: Date.now() + 2
                    };
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

    return (
        <div className="flex h-screen w-full bg-white overflow-hidden text-sm">

            {/* Left Column: Context / API Controller */}
            <div className="w-[300px] flex-shrink-0 border-r border-gray-100 flex flex-col z-20">
                <CustomerStatePanel
                    mocks={apiMocks}
                    onChangeMocks={setApiMocks}
                    onReevaluate={() => {
                        // Resend the last context but force a re-evaluation
                        if (messages.length > 0) {
                            const lastUserText = [...messages].reverse().find(m => m.role === 'user')?.content || "Hola";
                            handleSendMessage(lastUserText, 'AIzaSyBZO5cajpEeKWvlLeHrnysVnIdpKKQ3KuU', true);
                        } else {
                            handleSendMessage("Evalúa mi estado actual", 'AIzaSyBZO5cajpEeKWvlLeHrnysVnIdpKKQ3KuU', true);
                        }
                    }}
                />
            </div>

            {/* Middle Column: Chat */}
            <div className="flex-1 flex flex-col min-w-0 z-10 bg-white">
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onResetChat={() => setMessages([])}
                    isProcessing={isProcessing}
                />
            </div>

            {/* Right Column: Logs */}
            <div className="w-[450px] flex-shrink-0 border-l border-gray-100 flex flex-col bg-slate-50 z-20">
                <ApiMocksPanel mocks={apiMocks} onChange={setApiMocks} />
            </div>

        </div>
    );
}
