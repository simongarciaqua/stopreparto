import React from 'react';
import { CustomerState } from '@/lib/types';
import { ToggleLeft, ToggleRight, Check, ChevronsUpDown, RefreshCw } from 'lucide-react';

const PropertyRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className="flex items-center">
            {children}
        </div>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-2 bg-gray-50/50 border-y border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {title}
    </div>
);

// Minimal Switch
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 ${checked ? 'bg-blue-600' : 'bg-gray-200'
            }`}
    >
        <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-1'
                }`}
        />
    </button>
);

interface CustomerStatePanelProps {
    state: CustomerState;
    onChange: (newState: CustomerState) => void;
    onReevaluate: () => void;
}

export const CustomerStatePanel: React.FC<CustomerStatePanelProps> = ({ state, onChange, onReevaluate }) => {
    const updateState = (key: keyof CustomerState, value: any) => {
        onChange({ ...state, [key]: value });
    };

    const scenarios = [
        {
            name: "Stop activo cancelable",
            state: { hasActiveStop: true, canRequestStopDelivery: false, canCancelStop: true, selectedReason: 'agua_acumulada', simulatedInconsistency: false }
        },
        {
            name: "Cuota mínima deshabilitada",
            state: { hasActiveStop: false, canRequestStopDelivery: true, canCancelStop: false, selectedReason: 'vacaciones', simulatedInconsistency: false }
        },
        {
            name: "Cliente bloqueado",
            state: { hasActiveStop: false, canRequestStopDelivery: false, canCancelStop: false, selectedReason: 'otro', simulatedInconsistency: false }
        },
        {
            name: "Estado incoherente",
            state: { hasActiveStop: true, canRequestStopDelivery: true, canCancelStop: false, selectedReason: 'agua_acumulada', simulatedInconsistency: true }
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Panel Header */}
            <div className="panel-header justify-between">
                <span>Estado Cliente</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReevaluate}
                        title="Re-evaluar estado"
                        className="p-1 hover:bg-gray-100 rounded text-blue-600 transition-colors"
                    >
                        <RefreshCw size={14} />
                    </button>
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <SectionHeader title="Acciones Rápidas" />
                <div className="p-4 flex flex-col gap-2">
                    <button
                        onClick={onReevaluate}
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                        <RefreshCw size={14} />
                        🔄 Re-evaluar estado
                    </button>
                </div>

                <SectionHeader title="Escenarios Guardados" />
                <div className="p-4 grid grid-cols-1 gap-2">
                    {scenarios.map((s) => (
                        <button
                            key={s.name}
                            onClick={() => onChange(s.state)}
                            className="text-left text-[11px] px-3 py-2 border border-gray-100 rounded hover:border-blue-200 hover:bg-blue-50/30 transition-all text-gray-600 font-medium"
                        >
                            {s.name}
                        </button>
                    ))}
                </div>

                {/* State Section */}
                <SectionHeader title="Flags de Servicio" />
                <PropertyRow label="Stop Activo">
                    <Switch checked={state.hasActiveStop} onChange={(v) => updateState('hasActiveStop', v)} />
                </PropertyRow>
                <PropertyRow label="Puede Pedir Stop">
                    <Switch checked={state.canRequestStopDelivery} onChange={(v) => updateState('canRequestStopDelivery', v)} />
                </PropertyRow>
                <PropertyRow label="Puede Cancelar Stop">
                    <Switch checked={state.canCancelStop} onChange={(v) => updateState('canCancelStop', v)} />
                </PropertyRow>
                <PropertyRow label="Simular Inconsistencia">
                    <Switch checked={state.simulatedInconsistency} onChange={(v) => updateState('simulatedInconsistency', v)} />
                </PropertyRow>

                {/* Context Section */}
                <SectionHeader title="Contexto Actual" />

                <div className="p-4 space-y-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Motivo de la consulta</label>
                    <div className="relative">
                        <select
                            value={state.selectedReason}
                            onChange={(e) => updateState('selectedReason', e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        >
                            <option value="agua_acumulada">Agua Acumulada</option>
                            <option value="vacaciones">Vacaciones</option>
                            <option value="cambio_consumo">Cambio de Consumo</option>
                            <option value="otro">Otro</option>
                        </select>
                        <ChevronsUpDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <SectionHeader title="Raw State View" />
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <pre className="text-[10px] font-mono text-gray-500 overflow-x-auto">
                        {JSON.stringify(state, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};
