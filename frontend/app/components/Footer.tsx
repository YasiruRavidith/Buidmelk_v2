import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-stone-600">© {new Date().getFullYear()} BuildMe.lk. All rights reserved.</div>

        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/about" className="text-sm text-stone-600 hover:text-stone-900">About</Link>
          <Link href="/contact" className="text-sm text-stone-600 hover:text-stone-900">Contact</Link>
          <Link href="/terms" className="text-sm text-stone-600 hover:text-stone-900">Terms</Link>
          <Link href="/privacy" className="text-sm text-stone-600 hover:text-stone-900">Privacy</Link>
        </nav>
      </div>
    </footer>
  )
}
