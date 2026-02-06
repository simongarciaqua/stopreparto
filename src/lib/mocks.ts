import { ApiMocks } from './types';

export const INITIAL_API_MOCKS: ApiMocks = {
    stop_delivery: {
        enabled: true,
        requested: false
    },
    get_support_stop_delivery: {
        can_request_stop_delivery: true,
        requested: false,
        can_cancel: false,
        anticipated_next_delivery_date: "2026-02-15",
        next_delivery_date: "2026-02-22",
        faq_url: "https://example.com/faq",
        has_pending_invoices: false,
        cannot_request_more_contact_phone: "900 123 456",
        options: [
            { id: "plan_completo", title: "Plan completo", description: "Seguimos facturando tu plan habitual y las botellas se acumulan en tu saldo.", enabled: true },
            { id: "cuota_minima", title: "Cuota mínima", description: "Pausas el servicio sin recibir botellas y se aplica una cuota mínima de 4,90 €.", enabled: true }
        ]
    },
    post_support_stop_delivery_request: { success: { message: "Stop solicitado correctamente" } },
    post_support_stop_delivery_cancel: { success: { message: "Stop cancelado correctamente" } },

    delivery_config: {
        viewConfiguration: {
            showUrgentDelivery: "VISIBLE",
            isEnabledStopDelivery: "VISIBLE"
        }
    },
    delivery_info: {
        facturas_pendientes: 0,
        products: [
            { productCode: "B20", productName: "Botella 20L", maxQuantity: 5, quantity: 0, family: 1, description: "Agua Mineral 20 Litros" },
            { productCode: "SP24", productName: "Botellas 50cl (Caja 24)", maxQuantity: 5, quantity: 0, family: 1 },
            { productCode: "CAPS ESPRESSO", productName: "Café Espresso", maxQuantity: 30, quantity: 0, family: 2, intensity: 4 },
            { productCode: "CAPS RISTRETTO", productName: "Café Ristretto", maxQuantity: 30, quantity: 0, family: 2, intensity: 5 },
            { productCode: "CAPS DECAFFEINATO", productName: "Café Descafeinado", maxQuantity: 30, quantity: 0, family: 2, intensity: 3 },
            { productCode: "COT VASOS", productName: "Vasos (100u)", maxQuantity: 10, quantity: 0, family: 3 }
        ]
    },
    post_urgent_delivery_response: {
        success: {
            message: "Pedido urgente realizado",
            documentNumber: 12345678,
            textMaxDelay: "Entrega en 24/48h"
        }
    }
};
