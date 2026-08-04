import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/hooks/use-toast'

export const metadata: Metadata = {
  title: 'Gestion Fournisseurs',
  description: 'Système de gestion des fournisseurs',
  generator: 'v0.app',
  icons: {
    icon: 
    
      {
        url: '/icone.ico',
        type: 'image/svg+xml',
      }
    
  
}}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
