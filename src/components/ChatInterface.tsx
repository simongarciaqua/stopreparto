import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import { Send, Settings, TerminalSquare, Key, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (content: string, apiKey: string) => Promise<void>;
    onResetChat: () => void;
    isProcessing: boolean;
    apiKey: string;
    setApiKey: (key: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onResetChat, isProcessing, apiKey, setApiKey }) => {
    const [input, setInput] = useState('');
    // apiKey state lifted to parent
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const content = input;
        setInput('');
        await onSendMessage(content, apiKey);
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="panel-header justify-between bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <TerminalSquare size={16} className="text-gray-500" />
                    <span>Agent Simulator</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onResetChat}
                        title="Reiniciar chat"
                        className="p-1.5 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Settings Overlay */}
            {showSettings && (
                <div className="absolute top-12 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <Key size={14} className="text-gray-400" />
                        <h3 className="text-xs font-semibold text-gray-900 uppercase">Configuration</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Google Gemini API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full text-xs font-mono p-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                        <p className="text-sm font-medium">Ready to start.</p>
                    </div>
                )}

                <div className="flex flex-col">
                    {messages.map((msg) => (
                        // ... inside map
                        <div
                            key={msg.id}
                            className={`flex gap-4 px-6 py-6 border-b border-gray-50 ${msg.role === 'assistant' ? 'bg-gray-50/30' :
                                msg.role === 'system' ? 'bg-slate-900 border-b-slate-800 py-3' : 'bg-white'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'bg-gray-900 text-white' :
                                msg.role === 'system' ? 'bg-transparent text-emerald-500' : 'bg-blue-600 text-white'
                                }`}>
                                {msg.role === 'user' ? 'User' : msg.role === 'system' ? '>' : 'Bot'}
                            </div>

                            <div className="flex-1 space-y-1">
                                {msg.role !== 'system' && (
                                    <p className="text-xs font-bold text-gray-900 mb-1">{msg.role === 'user' ? 'Tú' : 'Asistente'}</p>
                                )}
                                <div className={`text-sm leading-6 whitespace-pre-wrap ${msg.role === 'system' ? 'font-mono text-emerald-400 text-xs' : 'text-gray-700 font-normal'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="px-6 py-6 border-b border-gray-50 bg-gray-50/30 flex gap-4">
                            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold text-white uppercase tracking-wider">
                                Bot
                            </div>
                            <div className="flex items-center gap-1 h-6">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        disabled={isProcessing}
                        className="flex-1 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm rounded-md px-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
};
