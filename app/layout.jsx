import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '600'],
})

export const metadata = {
  title: '0880 | Arte en cada puntada',
  description: 'Lujo Silencioso • Hecho a Mano • México',
  keywords: ['lujo silencioso', 'bolsos hechos a mano', 'artesanía mexicana', '0880', 'luxury handbags'],
  authors: [{ name: '0880 Luxury Collection' }],
  openGraph: {
    title: '0880 | Arte en cada puntada',
    description: 'Lujo Silencioso • Hecho a Mano • México',
    url: 'https://0880.mx',
    siteName: '0880 Luxury Collection',
    images: [
      {
        url: '/images/Gemini_Generated_Image_fzyqpqfzyqpqfzyq.png',
        width: 1200,
        height: 630,
        alt: '0880 Luxury Collection Editorial',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '0880 | Arte en cada puntada',
    description: 'Lujo Silencioso • Hecho a Mano • México',
    images: ['/images/Gemini_Generated_Image_fzyqpqfzyqpqfzyq.png'],
  },
}

import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="luxury" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
