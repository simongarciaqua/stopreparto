import React, { useState, useEffect } from 'react';
import { ApiMocks, ActiveProcess } from '@/lib/types';
import { Network } from 'lucide-react';

interface ApiMocksPanelProps {
    mocks: ApiMocks;
    activeProcess: ActiveProcess;
    onChange: (newMocks: ApiMocks) => void;
}

export const ApiMocksPanel: React.FC<ApiMocksPanelProps> = ({ mocks, activeProcess, onChange }) => {
    // Keep local text state so user can type freely
    const [jsonText, setJsonText] = useState("");
    const [valid, setValid] = useState(true);

    // Determine relevant keys based on process
    const getRelevantKeys = (process: ActiveProcess): (keyof ApiMocks)[] => {
        if (process === 'STOP_REPARTO') {
            return [
                'stop_delivery',
                'get_support_stop_delivery',
                'post_support_stop_delivery_request',
                'post_support_stop_delivery_cancel'
            ];
        }
        if (process === 'AVISO_URGENTE') {
            return [
                'delivery_config',
                'delivery_info',
                'post_urgent_delivery_response'
            ];
        }
        return []; // Show all if empty/orchestrator
    };

    // Filter the full mock object to just the relevant parts
    const getFilteredMocks = () => {
        const keys = getRelevantKeys(activeProcess);
        if (keys.length === 0) return mocks; // Return full object if no filter

        const filtered: Partial<ApiMocks> = {};
        keys.forEach(k => {
            // @ts-ignore
            filtered[k] = mocks[k];
        });
        return filtered;
    };

    // Sync from props to local text when props change (unless user is editing something that conflicts, but for now strict sync)
    useEffect(() => {
        const filtered = getFilteredMocks();
        setJsonText(JSON.stringify(filtered, null, 2));
        setValid(true);
    }, [mocks, activeProcess]); // Re-run when mocks or process changes

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setJsonText(newVal);

        try {
            const parsedFragment = JSON.parse(newVal);
            setValid(true);

            // Merge logic:
            // We need to merge 'parsedFragment' back into 'mocks'.
            // If we are showing ALL (Orchestrator), simply replace.
            // If we are showing Filtered, we merge the keys back.

            if (activeProcess === 'ORCHESTRATOR') {
                onChange(parsedFragment);
            } else {
                onChange({
                    ...mocks,
                    ...parsedFragment
                });
            }

        } catch (err) {
            setValid(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="panel-header justify-between bg-white border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                    <Network size={16} />
                    <span>
                        {activeProcess === 'ORCHESTRATOR' ? 'Full API State' : `API Context (${activeProcess})`}
                    </span>
                </div>
                <div>
                    {valid ? (
                        <span className="flex items-center text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            VALID JSON
                        </span>
                    ) : (
                        <span className="flex items-center text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            INVALID JSON
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 relative">
                <textarea
                    className="w-full h-full p-4 font-mono text-[11px] leading-5 bg-[#FAFAFA] text-gray-600 resize-none focus:outline-none border-none selection:bg-gray-200"
                    value={jsonText}
                    onChange={handleTextChange}
                    spellCheck={false}
                />
            </div>
        </div>
    );
};
