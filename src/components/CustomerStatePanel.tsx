import React from 'react';
import { ApiMocks } from '@/lib/types';
import { Check, RefreshCw, Layers, Database, Activity } from 'lucide-react';

const PropertyRow = ({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) => (
    <div className="flex items-center justify-between py-3">
        <div className="flex flex-col gap-0.5">
            <span className="text-sm text-gray-700 font-medium">{label}</span>
            {description && <span className="text-[10px] text-gray-400 font-mono tracking-tight">{description}</span>}
        </div>
        <div className="flex items-center">
            {children}
        </div>
    </div>
);

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
            <Icon size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        </div>
        <div className="p-4 flex flex-col gap-1">
            {children}
        </div>
    </div>
);

// High Contrast Switch
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        // Using inline styles for colors to guarantee visibility if Tailwind is stripping classes
        style={{ backgroundColor: checked ? '#22c55e' : '#ef4444' }}
        className={`group relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-7' : 'translate-x-1'
                }`}
        />
        <span className={`absolute text-[8px] font-bold text-white ${checked ? 'left-1.5' : 'right-1.5'}`}>
            {checked ? '' : ''}
        </span>
    </button>
);

interface CustomerStatePanelProps {
    mocks: ApiMocks;
    onChangeMocks: (newMocks: ApiMocks) => void;
    onReevaluate: () => void;
}

export const CustomerStatePanel: React.FC<CustomerStatePanelProps> = ({ mocks, onChangeMocks, onReevaluate }) => {

    const updateMock = (path: string[], value: any) => {
        // Deep clone for immutability
        const newMocks = JSON.parse(JSON.stringify(mocks));
        let current = newMocks;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        onChangeMocks(newMocks);
    };

    // New helper for batch updates to avoid race conditions
    const updateMultipleMocks = (updates: { path: string[], value: any }[]) => {
        const newMocks = JSON.parse(JSON.stringify(mocks));
        updates.forEach(({ path, value }) => {
            let current = newMocks;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
        });
        onChangeMocks(newMocks);
    };


    // Helper scenarios that set the FULL mock state to consistent values
    const scenarios = [
        {
            name: "Usuario Estándar",
            description: "Puede solicitar stop",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                m.stop_delivery.requested = false;
                m.get_support_stop_delivery.requested = false;
                m.get_support_stop_delivery.can_request_stop_delivery = true;
                m.get_support_stop_delivery.can_cancel = false;
                onChangeMocks(m);
            }
        },
        {
            name: "Stop Activo (OK)",
            description: "Permite cancelar",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                m.stop_delivery.requested = true;
                m.get_support_stop_delivery.requested = true;
                m.get_support_stop_delivery.can_request_stop_delivery = false;
                m.get_support_stop_delivery.can_cancel = true;
                onChangeMocks(m);
            }
        },
        {
            name: "Stop Activo (Bloq)",
            description: "No permite cancelar",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                m.stop_delivery.requested = true;
                m.get_support_stop_delivery.requested = true;
                m.get_support_stop_delivery.can_request_stop_delivery = false;
                m.get_support_stop_delivery.can_cancel = false;
                onChangeMocks(m);
            }
        },
        {
            name: "Usuario Bloqueado",
            description: "No puede hacer nada",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                m.stop_delivery.requested = false;
                m.get_support_stop_delivery.requested = false;
                m.get_support_stop_delivery.can_request_stop_delivery = false;
                m.get_support_stop_delivery.can_cancel = false;
                onChangeMocks(m);
            }
        }
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50/50 text-sm">
            {/* Panel Header */}
            <div className="panel-header justify-between bg-white border-b border-gray-200 px-5 flex-none z-10 shadow-sm">
                <span className="font-bold text-gray-800 tracking-tight">API Controller</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReevaluate}
                        title="Re-evaluar"
                        className="p-1.5 hover:bg-gray-100 rounded-md text-blue-600 transition-colors"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col p-4">

                {/* Scenarios Section */}
                <SectionCard title="Escenarios Rápidos" icon={Layers}>
                    <div className="grid grid-cols-1 gap-2">
                        {scenarios.map((s) => (
                            <button
                                key={s.name}
                                onClick={s.apply}
                                className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-blue-300 hover:ring-1 hover:ring-blue-300 hover:shadow-md transition-all active:scale-[0.99]"
                            >
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-gray-700 font-semibold text-xs group-hover:text-blue-700">{s.name}</span>
                                    <span className="text-[10px] text-gray-400">{s.description}</span>
                                </div>
                                <Check size={14} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </SectionCard>

                {/* Flags Section */}
                <SectionCard title="Estado del Servicio" icon={Activity}>
                    <PropertyRow label="Stop Solicitado" description="stop_delivery.requested">
                        <Switch
                            checked={mocks.stop_delivery.requested}
                            onChange={(v) => {
                                updateMultipleMocks([
                                    { path: ['stop_delivery', 'requested'], value: v },
                                    { path: ['get_support_stop_delivery', 'requested'], value: v }
                                ]);
                            }}
                        />
                    </PropertyRow>

                    <PropertyRow label="Permitir Solicitud" description="can_request_stop_delivery">
                        <Switch
                            checked={mocks.get_support_stop_delivery.can_request_stop_delivery}
                            onChange={(v) => updateMock(['get_support_stop_delivery', 'can_request_stop_delivery'], v)}
                        />
                    </PropertyRow>

                    <PropertyRow label="Permitir Cancelar" description="can_cancel">
                        <Switch
                            checked={mocks.get_support_stop_delivery.can_cancel}
                            onChange={(v) => updateMock(['get_support_stop_delivery', 'can_cancel'], v)}
                        />
                    </PropertyRow>

                    <PropertyRow label="Facturas Pendientes" description="has_pending_invoices">
                        <Switch
                            checked={!!mocks.get_support_stop_delivery.has_pending_invoices}
                            onChange={(v) => updateMock(['get_support_stop_delivery', 'has_pending_invoices'], v)}
                        />
                    </PropertyRow>
                </SectionCard>

                {/* Options Section */}
                <SectionCard title="Opciones (Feature Flags)" icon={Database}>
                    {mocks.get_support_stop_delivery.options.map((opt, idx) => (
                        <PropertyRow key={opt.id} label={opt.title} description={`id: ${opt.id}`}>
                            <Switch
                                checked={opt.enabled}
                                onChange={(v) => updateMock(['get_support_stop_delivery', 'options', idx.toString(), 'enabled'], v)}
                            />
                        </PropertyRow>
                    ))}
                </SectionCard>


                {/* Spacer to push content up */}
                <div className="flex-1 min-h-[20px]" />

                {/* Action Footer */}
                <div className="sticky bottom-0 z-10 pt-4">
                    <button
                        onClick={onReevaluate}
                        className="flex items-center justify-center gap-2 w-full py-3 px-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-black hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        <RefreshCw size={14} />
                        Forzar Re-evaluación del Agente
                    </button>
                </div>

            </div>
        </div>
    );
};
