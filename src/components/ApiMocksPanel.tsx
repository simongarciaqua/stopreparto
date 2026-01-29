import React, { useState, useEffect } from 'react';
import { ApiMocks } from '@/lib/types';
import { Network, Check, AlertCircle } from 'lucide-react';

interface ApiMocksPanelProps {
    mocks: ApiMocks;
    onChange: (newMocks: ApiMocks) => void;
}

export const ApiMocksPanel: React.FC<ApiMocksPanelProps> = ({ mocks, onChange }) => {
    const [jsonText, setJsonText] = useState(JSON.stringify(mocks, null, 2));
    const [valid, setValid] = useState(true);

    useEffect(() => {
        try {
            if (JSON.stringify(JSON.parse(jsonText)) !== JSON.stringify(mocks)) {
                setJsonText(JSON.stringify(mocks, null, 2));
            }
        } catch (e) {
            // Ignore
        }
    }, [mocks]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setJsonText(newVal);
        try {
            const parsed = JSON.parse(newVal);
            setValid(true);
            onChange(parsed);
        } catch (err) {
            setValid(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="panel-header justify-between bg-white border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                    <Network size={16} />
                    <span>API Response Mocks</span>
                </div>
                <div>
                    {valid ? (
                        <span className="flex items-center text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            VALID
                        </span>
                    ) : (
                        <span className="flex items-center text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            INVALID
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
