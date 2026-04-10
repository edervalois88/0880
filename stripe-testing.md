# Guía de Pruebas: Pagos e Inventario (Stripe)

Esta guía contiene todo lo necesario para probar el flujo de compra y la actualización automática de inventario en el entorno de **test**.

## 1. Datos de Tarjeta de Prueba

Usa los siguientes datos en el formulario de Stripe Checkout:

| Campo | Valor |
| :--- | :--- |
| **Número de tarjeta** | `4242 4242 4242 4242` |
| **Fecha de expiración** | Cualquier fecha futura (ej. `12/30`) |
| **CVC** | `123` |
| **Código Postal** | `12345` |

---

## 2. Cómo Probar Webhooks Localmente

Para que el inventario se descuente en tu computadora local (localhost), necesitas el **Stripe CLI**.

1.  **Abrir una terminal nueva**.
2.  **Iniciar sesión** (si es la primera vez):
    ```powershell
    stripe login
    ```
3.  **Reenviar eventos al Webhook**:
    ```powershell
    stripe listen --forward-to localhost:3000/api/stripe/webhook
    ```
4.  **Copiar el "Webhook Signing Secret"** que te dará la terminal (empieza por `whsec_...`).
5.  **Pegarlo en tu archivo `.env.local`**:
    ```env
    STRIPE_WEBHOOK_SECRET=whsec_tu_secreto_aqui
    ```
6.  **Reiniciar el servidor** (`npm run dev`).

---

## 3. Flujo de Prueba Paso a Paso

1.  **Verificar Stock Actual**: Ve al panel de admin (`/admin`) y anota el stock de un producto (ej. "Valentina Gold" tiene 10 unidades).
2.  **Realizar Compra**: Ve al catálogo, selecciona el producto y completa el pago con la tarjeta `4242`.
3.  **Confirmar en Stripe**: Verás que la página te redirige a `/checkout/success`.
4.  **Verificar Inventario**:
    *   Regresa al panel de admin.
    *   El stock debería haber bajado a 9.
    *   En el **Activity Feed** del Dashboard debería aparecer una nueva entrada: `"Venta Stripe: cs_test_..."`.

---

## 4. Solución de Problemas

- **El stock no baja**: Asegúrate de que el proceso `stripe listen` esté corriendo y que el `STRIPE_WEBHOOK_SECRET` sea el correcto (el local es diferente al de producción en Vercel).
- **Error 500 en el webhook**: Revisa la terminal de `npm run dev` para ver logs de error detallados.
