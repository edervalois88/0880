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
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="luxury" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
