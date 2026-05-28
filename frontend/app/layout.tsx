import { Playfair_Display, Inter } from 'next/font/google'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { AuthProvider } from '../hooks/useAuth'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'BuildMe.lk | Quiet Luxury Construction',
  description: 'Sri Lanka\'s premium construction and architecture marketplace.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-24 md:pt-24">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}