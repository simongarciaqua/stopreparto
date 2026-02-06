import React from 'react';
import { ApiMocks, ActiveProcess } from '@/lib/types';
import { Check, RefreshCw, Layers, Database, Activity, Truck, AlertTriangle } from 'lucide-react';

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
const Switch = ({ checked, onChange, color = 'green', offColor = 'gray' }: { checked: boolean; onChange: (v: boolean) => void, color?: 'green' | 'red' | 'blue' | 'orange', offColor?: 'gray' | 'red' }) => {
    const bgColors = {
        green: checked ? '#22c55e' : (offColor === 'red' ? '#ef4444' : '#e5e7eb'), // Custom logic for Off=Red
        red: checked ? '#ef4444' : '#e5e7eb',
        blue: checked ? '#3b82f6' : '#e5e7eb',
        orange: checked ? '#f97316' : (offColor === 'red' ? '#ef4444' : '#e5e7eb')
    };

    // We can simplify this: 
    // If checked -> Use 'color'
    // If unchecked -> Use 'offColor' (default gray)

    const activeColor = checked
        ? (color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#f97316')
        : (offColor === 'red' ? '#ef4444' : '#e5e7eb');

    return (
        <button
            onClick={() => onChange(!checked)}
            style={{ backgroundColor: activeColor }}
            className={`group relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-7' : 'translate-x-1'
                    }`}
            />
        </button>
    );
};

interface CustomerStatePanelProps {
    mocks: ApiMocks;
    activeProcess: ActiveProcess;
    onChangeMocks: (newMocks: ApiMocks) => void;
    onReevaluate: () => void;
}

export const CustomerStatePanel: React.FC<CustomerStatePanelProps> = ({ mocks, activeProcess, onChangeMocks, onReevaluate }) => {

    const updateMock = (path: string[], value: any) => {
        const newMocks = JSON.parse(JSON.stringify(mocks));
        let current = newMocks;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        onChangeMocks(newMocks);
    };

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

    // --- STOP REPARTO SCENARIOS ---
    const stopScenarios = [
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
        }
    ];

    // --- URGENT DELIVERY SCENARIOS ---
    const urgentScenarios = [
        {
            name: "Usuario Estándar",
            description: "Limpio, sin facturas",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                if (m.delivery_config) {
                    m.delivery_config.viewConfiguration.showUrgentDelivery = "VISIBLE";
                }
                if (m.delivery_info) {
                    m.delivery_info.facturas_pendientes = 0;
                    m.delivery_info.current_order = undefined;
                }
                onChangeMocks(m);
            }
        },
        {
            name: "Usuario Bloqueado",
            description: "Facturas pendientes",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                if (m.delivery_info) {
                    m.delivery_info.facturas_pendientes = 1;
                }
                onChangeMocks(m);
            }
        },
        {
            name: "Pedido en Curso",
            description: "Ya tiene un pedido",
            apply: () => {
                const m = JSON.parse(JSON.stringify(mocks));
                if (m.delivery_info) {
                    m.delivery_info.current_order = {
                        documentNumber: "123456",
                        documentDate: "2026-02-03",
                        products: [{ id: "B20", quantity: 2 }]
                    };
                }
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
                    <div className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${activeProcess === 'STOP_REPARTO' ? 'bg-red-500 shadow-red-500/40' : activeProcess === 'AVISO_URGENTE' ? 'bg-orange-500 shadow-orange-500/40' : 'bg-gray-400'}`} />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto w-full flex flex-col p-4">

                {activeProcess === 'ORCHESTRATOR' && (
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-xs leading-relaxed border border-blue-100">
                        El <strong>Orquestador</strong> está escuchando. <br />
                        Escribe algo en el chat para detectar la intención y activar el panel correspondiente.
                    </div>
                )}

                {/* STOP REPARTO UI */}
                {activeProcess === 'STOP_REPARTO' && (
                    <>
                        <SectionCard title="Escenarios Stop" icon={Layers}>
                            <div className="grid grid-cols-1 gap-2">
                                {stopScenarios.map((s) => (
                                    <button
                                        key={s.name}
                                        onClick={s.apply}
                                        className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-red-300 hover:ring-1 hover:ring-red-300 transition-all"
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-gray-700 font-semibold text-xs group-hover:text-red-700">{s.name}</span>
                                            <span className="text-[10px] text-gray-400">{s.description}</span>
                                        </div>
                                        <Check size={14} className="text-gray-200 group-hover:text-red-500 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Estado API Stop" icon={Activity}>
                            <PropertyRow label="Stop Solicitado" description="requested">
                                <Switch
                                    color="red"
                                    checked={mocks.stop_delivery.requested}
                                    onChange={(v) => {
                                        updateMultipleMocks([
                                            { path: ['stop_delivery', 'requested'], value: v },
                                            { path: ['get_support_stop_delivery', 'requested'], value: v }
                                        ]);
                                    }}
                                />
                            </PropertyRow>
                            <PropertyRow label="Permite Cancelar" description="can_cancel">
                                <Switch
                                    color="red"
                                    checked={mocks.get_support_stop_delivery.can_cancel}
                                    onChange={(v) => updateMock(['get_support_stop_delivery', 'can_cancel'], v)}
                                />
                            </PropertyRow>
                            <PropertyRow label="Facturas Pendientes" description="has_pending_invoices">
                                <Switch
                                    color="red"
                                    checked={!!mocks.get_support_stop_delivery.has_pending_invoices}
                                    onChange={(v) => updateMock(['get_support_stop_delivery', 'has_pending_invoices'], v)}
                                />
                            </PropertyRow>
                        </SectionCard>
                    </>
                )}

                {/* REPARTO URGENTE UI */}
                {activeProcess === 'AVISO_URGENTE' && (
                    <>
                        <SectionCard title="Escenarios Urgente" icon={Truck}>
                            <div className="grid grid-cols-1 gap-2">
                                {urgentScenarios.map((s) => (
                                    <button
                                        key={s.name}
                                        onClick={s.apply}
                                        className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white hover:border-orange-300 hover:ring-1 hover:ring-orange-300 transition-all"
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-gray-700 font-semibold text-xs group-hover:text-orange-700">{s.name}</span>
                                            <span className="text-[10px] text-gray-400">{s.description}</span>
                                        </div>
                                        <Check size={14} className="text-gray-200 group-hover:text-orange-500 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard title="Configuración" icon={Database}>
                            <PropertyRow label="Habilitado" description="showUrgentDelivery">
                                <Switch
                                    color="green"
                                    offColor="red"
                                    checked={mocks.delivery_config?.viewConfiguration.showUrgentDelivery === 'VISIBLE'}
                                    onChange={(v) => updateMock(['delivery_config', 'viewConfiguration', 'showUrgentDelivery'], v ? 'VISIBLE' : 'HIDDEN')}
                                />
                            </PropertyRow>
                            <PropertyRow label="Facturas Pendientes" description="facturas_pendientes">
                                <Switch
                                    color="orange"
                                    checked={mocks.delivery_info?.facturas_pendientes === 1}
                                    onChange={(v) => updateMock(['delivery_info', 'facturas_pendientes'], v ? 1 : 0)}
                                />
                            </PropertyRow>
                            <PropertyRow label="Pedido Activo" description="current_order != null">
                                <Switch
                                    color="orange"
                                    checked={!!mocks.delivery_info?.current_order}
                                    onChange={(v) => {
                                        if (v) {
                                            updateMock(['delivery_info', 'current_order'], { documentNumber: "123", products: [] });
                                        } else {
                                            updateMock(['delivery_info', 'current_order'], undefined);
                                        }
                                    }}
                                />
                            </PropertyRow>
                        </SectionCard>
                    </>
                )}

                <div className="flex-1 min-h-[20px]" />

                <div className="sticky bottom-0 z-10 pt-4">
                    <button
                        onClick={onReevaluate}
                        className="flex items-center justify-center gap-2 w-full py-3 px-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-black hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        <RefreshCw size={14} />
                        Forzar Re-evaluación
                    </button>
                </div>

            </div>
        </div>
    );
};
