import { Resend } from 'resend'

interface OrderConfirmationProps {
  customerEmail: string
  productName: string
  productImage: string
  productCollection: string
  total: number
  stripeSessionId: string
}

interface StatusUpdateProps {
  customerEmail: string
  productName: string
  productImage: string
  stripeSessionId: string
  trackingNumber?: string
}

function emailShell(shortId: string, headerBg: string, headerLabel: string, headerTitle: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e0d6;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:${headerBg};padding:28px 40px;text-align:center;">
            <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:6px;text-transform:uppercase;font-family:Arial,sans-serif;">${headerLabel}</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:26px;font-weight:400;letter-spacing:4px;font-family:Georgia,serif;">${headerTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9c8c76;font-family:Arial,sans-serif;">Pedido</p>
            <p style="margin:0 0 28px;font-size:13px;color:#3d3530;font-family:monospace;letter-spacing:2px;">#${shortId}</p>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f5f0e8;padding:20px 40px;text-align:center;border-top:1px solid #e7e0d6;">
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9c8c76;font-family:Arial,sans-serif;">Hecho a Mano · León, Guanajuato · México</p>
            <p style="margin:0;font-size:10px;color:#b5a898;font-family:Arial,sans-serif;">© 2025 0880 Luxury Collection. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendStatusProcessing({ customerEmail, productName, productImage, stripeSessionId }: StatusUpdateProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = stripeSessionId.slice(-8).toUpperCase()
  await resend.emails.send({
    from: 'pedidos@0880mx.com',
    to: customerEmail,
    subject: `Tu pedido 0880 está siendo preparado #${shortId}`,
    html: emailShell(shortId, '#0a0a0a', 'Estado del Pedido', '0880', `
      <p style="font-size:16px;color:#3d3530;line-height:1.6;margin:0 0 20px;">
        Estamos preparando tu <strong>${productName}</strong> con todo el cuidado que merece.
        Pronto estará listo para enviarse.
      </p>
      ${productImage ? `<img src="${productImage}" alt="${productName}" width="120" style="display:block;border-radius:4px;margin-bottom:20px;" />` : ''}
      <p style="font-size:14px;color:#9c8c76;line-height:1.6;margin:0;">
        Te notificaremos cuando tu pedido sea enviado.
      </p>
    `),
  })
}

export async function sendStatusShipped({ customerEmail, productName, productImage, stripeSessionId, trackingNumber }: StatusUpdateProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = stripeSessionId.slice(-8).toUpperCase()
  await resend.emails.send({
    from: 'pedidos@0880mx.com',
    to: customerEmail,
    subject: `¡Tu pedido 0880 va en camino! #${shortId}`,
    html: emailShell(shortId, '#1a3a5c', 'En Camino', '0880', `
      <p style="font-size:16px;color:#3d3530;line-height:1.6;margin:0 0 20px;">
        Tu <strong>${productName}</strong> ha sido enviado y ya está en camino hacia ti.
      </p>
      ${productImage ? `<img src="${productImage}" alt="${productName}" width="120" style="display:block;border-radius:4px;margin-bottom:20px;" />` : ''}
      ${trackingNumber ? `
      <div style="background:#f0f4f8;border-left:3px solid #3b82f6;padding:16px;border-radius:0 4px 4px 0;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#64748b;font-family:Arial,sans-serif;">Número de Rastreo</p>
        <p style="margin:0;font-size:15px;color:#1e3a5f;font-family:monospace;letter-spacing:2px;">${trackingNumber}</p>
      </div>` : ''}
      <p style="font-size:14px;color:#9c8c76;line-height:1.6;margin:0;">
        El tiempo estimado de entrega es de 3 a 5 días hábiles.
      </p>
    `),
  })
}

export async function sendStatusDelivered({ customerEmail, productName, productImage, stripeSessionId }: StatusUpdateProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const shortId = stripeSessionId.slice(-8).toUpperCase()
  await resend.emails.send({
    from: 'pedidos@0880mx.com',
    to: customerEmail,
    subject: `¡Tu pedido 0880 fue entregado! #${shortId}`,
    html: emailShell(shortId, '#14532d', 'Entregado', '0880', `
      <p style="font-size:16px;color:#3d3530;line-height:1.6;margin:0 0 20px;">
        ¡Tu <strong>${productName}</strong> ha llegado! Esperamos que lo disfrutes tanto como nosotros disfrutamos crearlo.
      </p>
      ${productImage ? `<img src="${productImage}" alt="${productName}" width="120" style="display:block;border-radius:4px;margin-bottom:20px;" />` : ''}
      <p style="font-size:14px;color:#9c8c76;line-height:1.6;margin:0;">
        Gracias por confiar en 0880. Cada pieza es hecha a mano con amor en León, Guanajuato.
      </p>
    `),
  })
}

export async function sendOrderConfirmation({
  customerEmail,
  productName,
  productImage,
  productCollection,
  total,
  stripeSessionId,
}: OrderConfirmationProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const formattedTotal = total.toLocaleString('es-MX')
  const shortId = stripeSessionId.slice(-8).toUpperCase()

  await resend.emails.send({
    from: 'pedidos@0880mx.com',
    to: customerEmail,
    subject: `¡Tu pedido 0880 está confirmado! #${shortId}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de Pedido 0880</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e0d6;border-radius:4px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:6px;text-transform:uppercase;font-family:Arial,sans-serif;">Colección de Lujo</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:400;letter-spacing:4px;font-family:Georgia,serif;">0880</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9c8c76;font-family:Arial,sans-serif;">Número de pedido</p>
              <p style="margin:0 0 32px;font-size:14px;color:#3d3530;font-family:monospace;letter-spacing:2px;">#${shortId}</p>

              <p style="margin:0 0 24px;font-size:16px;color:#3d3530;line-height:1.6;">
                Gracias por tu compra. Tu pedido ha sido confirmado y será procesado a la brevedad.
              </p>

              <!-- Product -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e0d6;border-radius:4px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td width="100" style="padding:16px;">
                    <img src="${productImage}" alt="${productName}" width="80" height="107" style="display:block;object-fit:cover;border-radius:2px;" />
                  </td>
                  <td style="padding:16px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9c8c76;font-family:Arial,sans-serif;">${productCollection}</p>
                    <p style="margin:0 0 12px;font-size:17px;color:#0a0a0a;">${productName}</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;letter-spacing:1px;">$${formattedTotal} <span style="font-size:10px;color:#9c8c76;font-family:Arial,sans-serif;letter-spacing:2px;">MXN</span></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#3d3530;line-height:1.6;">
                En breve recibirás información de envío con tu número de rastreo.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#3d3530;line-height:1.6;">
                Si tienes alguna pregunta, puedes contactarnos vía WhatsApp.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f5f0e8;padding:24px 40px;text-align:center;border-top:1px solid #e7e0d6;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#9c8c76;font-family:Arial,sans-serif;">Hecho a Mano · León, Guanajuato · México</p>
              <p style="margin:0;font-size:10px;color:#b5a898;font-family:Arial,sans-serif;">© 2025 0880 Luxury Collection. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  })
}
