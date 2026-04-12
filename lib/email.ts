import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderConfirmationProps {
  customerEmail: string
  productName: string
  productImage: string
  productCollection: string
  total: number
  stripeSessionId: string
}

export async function sendOrderConfirmation({
  customerEmail,
  productName,
  productImage,
  productCollection,
  total,
  stripeSessionId,
}: OrderConfirmationProps) {
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
