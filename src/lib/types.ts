export interface CustomerState {
    hasActiveStop: boolean;
    canRequestStopDelivery: boolean;
    canCancelStop: boolean;
    selectedReason: string;

    simulatedInconsistency: boolean;
    activeProcess: 'ORCHESTRATOR' | 'STOP_REPARTO' | 'AVISO_URGENTE';
}

export type ActiveProcess = 'ORCHESTRATOR' | 'STOP_REPARTO' | 'AVISO_URGENTE';

export interface ApiMocks {
    stop_delivery: {
        enabled: boolean;
        requested: boolean;
    };
    get_support_stop_delivery: {
        can_request_stop_delivery: boolean;
        requested: boolean;
        can_cancel: boolean;
        anticipated_next_delivery_date: string;
        next_delivery_date?: string;
        faq_url?: string;
        has_pending_invoices?: boolean;
        cannot_request_more_contact_phone?: string;
        options: Array<{
            id: string;
            title: string;
            description: string;
            enabled: boolean;
        }>;
    };
    post_support_stop_delivery_request: {
        success: {
            message: string;
        };
    };
    post_support_stop_delivery_cancel: {
        success: {
            message: string;
        };
    };
    // REPARTO URGENTE (REAL) BLOCKS
    delivery_config?: {
        viewConfiguration: {
            showUrgentDelivery: "VISIBLE" | "HIDDEN";
            isEnabledStopDelivery: "VISIBLE" | "HIDDEN";
        };
    };
    delivery_info?: {
        products: Array<{
            productCode: string;
            productName: string;
            maxQuantity: number;
            quantity: number; // Initial/Current quantity
            description?: string;
            family: number; // 1=Agua, 2=Cafe, 3=Otros
            intensity?: number;
        }>;
        facturas_pendientes: number; // 1 = blocked
        faq_url?: string;
        current_order?: {
            documentNumber: string;
            documentDate: string;
            products: Array<{ id: string; quantity: number }>;
        };
    };
    post_urgent_delivery_response?: {
        success?: {
            message: string;
            documentNumber: number;
            textMaxDelay: string;
        };
        error?: {
            code: number;
            message: string;
        };
    };
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
}
