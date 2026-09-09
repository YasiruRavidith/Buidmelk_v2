import { Fraunces, DM_Sans } from 'next/font/google'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AiAssistantWidget from './components/AiAssistantWidget'
import { AuthProvider } from '../hooks/useAuth'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-playfair', weight: ['300','400','500','600','700'], style: ['normal','italic'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-inter', weight: ['300','400','500','600','700'] })

export const metadata = {
  title: 'BuildMe.lk | Quiet Luxury Construction',
  description: 'Sri Lanka\'s premium construction and architecture marketplace.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${dmSans.variable} font-sans bg-background text-foreground antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16 sm:pt-20 md:pt-24">{children}</main>
          <Footer />
          <AiAssistantWidget />
        </AuthProvider>
      </body>
    </html>
  )
}