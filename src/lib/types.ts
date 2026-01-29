export interface CustomerState {
    hasActiveStop: boolean;
    canRequestStopDelivery: boolean;
    canCancelStop: boolean;
    selectedReason: string;
    simulatedInconsistency: boolean;
}

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
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
}
