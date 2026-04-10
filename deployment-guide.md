# Guía de Despliegue en Producción: 0880mx

Esta guía detalla los pasos críticos para asegurar que el sistema de ventas e inventario funcione correctamente una vez desplegado en **Vercel**.

## 1. Variables de Entorno (Vercel)

Debes configurar las siguientes variables en el panel de Vercel (**Settings > Environment Variables**):

| Variable | Origen | Importancia |
| :--- | :--- | :--- |
| `STRIPE_PUBLIC_KEY` | Stripe Dashboard (Clave pública) | Necesaria para el componente de Checkout. |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (Clave secreta) | Necesaria para crear sesiones de pago. |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI o Dashboard (Webhooks) | **CRÍTICA**: Sin esto, el stock NO se descontará automáticamente. |
| `NEXTAUTH_SECRET` | Comanda aleatoria | Necesaria para la seguridad de la sesión de Admin. |
| `DATABASE_URL` | Neon.tech (PostgreSQL) | Enlace a tu base de datos principal. |

---

## 2. Configuración del Webhook de Stripe

Para que el inventario se actualice automáticamente al recibir una compra, Stripe debe avisar a tu servidor.

1. Ve a [Stripe Webhooks](https://dashboard.stripe.com/webhooks).
2. Haz clic en **Add endpoint**.
3. **Endpoint URL**: `https://tu-dominio.vercel.app/api/stripe/webhook`
4. **Events to listen to**: Selecciona `checkout.session.completed`.
5. Una vez creado, copia el **Signing secret** y pégalo en Vercel como `STRIPE_WEBHOOK_SECRET`.

> [!IMPORTANT]
> Si estás probando localmente, usa el Stripe CLI con el comando `stripe listen --forward-to localhost:3000/api/stripe/webhook` para obtener un secreto temporal de pruebas.

---

## 3. Seguridad de Admin

Recuerda que solo los usuarios con el rol `admin` o `editor` en la base de datos pueden acceder al panel `/admin`. 
- Si es tu primer despliegue, el primer usuario que se registre no tendrá rol. 
- Debes asignar el rol `admin` manualmente en la base de datos (vía Prisma Studio o SQL) para el primer acceso, o usar la función de migración si ya tienes datos pre-configurados.

---

## 4. Mantenimiento de Imágenes

Todas las imágenes deben estar en la carpeta `public/images/` o ser URLs externas válidas. Si subes nuevas imágenes al catálogo, asegúrate de que la ruta sea accesible desde el navegador.
