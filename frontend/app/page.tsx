import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="bg-[#FCFAF7] font-sans pb-0">
      
      {/* Hero Image Section */}
      <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[90vh] min-h-[480px] flex flex-col justify-end">
        <Image
          src="/1778355227728.png"
          alt="Hero Image"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center z-0"
        />
        <div className="absolute inset-0 z-10 bg-[#303030]/10" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#101010]/90 via-[#101010]/20 to-transparent" />

        <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-10 sm:pb-16">
          <p className="text-white/80 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Welcome to BuildMe.lk</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-[5rem] text-white leading-[1.05] tracking-tight">
            Constructing <br className="hidden sm:block"/>The Future
          </h1>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-[#FAEBE7] py-14 sm:py-24 md:py-32 border-t border-[#8B4434]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex items-end justify-between gap-6 mb-10 md:mb-12">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 font-semibold mb-3">02 / 04</p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#8B4434]">Featured Projects</h2>
            </div>
            <Link href="/projects" className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434] font-semibold border-b border-[#8B4434]/30 pb-1 hover:border-[#8B4434] transition-colors">
              View all projects
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-12">
            <article className="md:col-span-8">
              <div className="relative h-[260px] sm:h-[320px] md:h-[360px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop"
                  alt="The Monolith Pavilion"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">The Monolith Pavilion</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-1">Zurich, Switzerland</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 pt-1">2023</p>
              </div>
            </article>

            <article className="md:col-span-4 md:mt-10">
              <div className="relative h-[260px] sm:h-[320px] md:h-[260px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                  alt="Kensington Retreat"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">Kensington Retreat</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-1">London, UK</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 pt-1">2022</p>
              </div>
            </article>

            <article className="md:col-span-4 md:mt-4">
              <div className="relative h-[260px] sm:h-[320px] md:h-[340px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1400&auto=format&fit=crop"
                  alt="Obsidian Gallery"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">Obsidian Gallery</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-1">Tokyo, Japan</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 pt-1">2024</p>
              </div>
            </article>

            <article className="md:col-span-8 md:mt-12">
              <div className="relative h-[260px] sm:h-[320px] md:h-[340px] overflow-hidden bg-[#efe6df] border border-[#8B4434]/10">
                <img
                  src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1400&auto=format&fit=crop"
                  alt="Aegean Residence"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl text-[#8B4434]">Aegean Residence</h3>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 mt-1">Mykonos, Greece</p>
                </div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#8B4434]/70 pt-1">2021</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Content Section: Information & Features */}
      <section className="bg-[#FCFAF7] max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 sm:py-24 md:py-32 flex flex-col lg:flex-row gap-10 lg:gap-32">
        {/* Sidebar Metadata */}
        <aside className="lg:w-1/4 flex flex-col gap-8 lg:gap-10 lg:pl-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-6 lg:gap-10">
            <div className="lg:border-l lg:border-[#8B4434]/20 lg:pl-6 lg:-ml-6">
              <h4 className="text-[#8B4434] text-[9px] uppercase tracking-[0.2em] font-semibold mb-2">Platform</h4>
              <p className="text-[#8B4434] text-xs font-light">BuildMe.lk Platform Hub</p>
            </div>
            <div className="lg:border-l lg:border-[#8B4434]/20 lg:pl-6 lg:-ml-6">
              <h4 className="text-[#8B4434] text-[9px] uppercase tracking-[0.2em] font-semibold mb-2">Scope</h4>
              <p className="text-[#8B4434] text-xs font-light">Estimation, Bidding &amp; Marketplace</p>
            </div>
            <div className="lg:border-l lg:border-[#8B4434]/20 lg:pl-6 lg:-ml-6">
              <h4 className="text-[#8B4434] text-[9px] uppercase tracking-[0.2em] font-semibold mb-2">Network</h4>
              <p className="text-[#8B4434] text-xs font-light">Thousands of Professionals</p>
            </div>
            <div className="lg:border-l lg:border-[#8B4434]/20 lg:pl-6 lg:-ml-6">
              <h4 className="text-[#8B4434] text-[9px] uppercase tracking-[0.2em] font-semibold mb-2">Services</h4>
              <ul className="text-[#8B4434] text-xs font-light space-y-1 list-none">
                <li>Project Estimations</li>
                <li>Material Marketplace</li>
                <li>Competitive Bidding</li>
                <li>Professional Directory</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Body */}
        <main className="lg:w-3/4">
          <h2 className="font-serif text-[2.5rem] lg:text-[3rem] text-[#8B4434] leading-[1.1] mb-10 pb-10 border-b border-[#8B4434]/10">
            A comprehensive ecosystem bridging the gap between vision and reality.
          </h2>

          <div className="text-[13px] text-[#606060] font-light leading-[2] mb-16 space-y-6 columns-1 md:columns-2 gap-12">
            <p>
              BuildMe.lk reimagines the entire construction workflow by unifying estimations, professional sourcing, finding correct materials, and launching competitive bids entirely under one streamlined ecosystem.
            </p>
            <p>
              Born out of the necessity to bring order and transparency back to the construction process in Sri Lanka, the platform facilitates both granular cost detailing and high-level project management. Whether you&apos;re an ambitious homeowner, a certified contractor, or an architectural firm bringing a monolithic vision to life, the tools have been curated meticulously for raw utility.
            </p>
            <p>
              The AI-driven estimation engines run deeply alongside current market rates mapped directly from verified local suppliers within our dedicated marketplace, effectively grounding calculations heavily in real-world feasibility.
            </p>
            <p>
              Find qualified architects, structural engineers, cost estimators, and general contractors in our Professional Directory. Browse their deep portfolios, observe their past executions, and directly invite them to bid on your project, streamlining what traditionally took weeks into an elegant few hours.
            </p>
          </div>

          {/* Action Links / Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-[#8B4434]/10">
            <Link href="/professionals" className="group flex items-center justify-between border border-[#8B4434] p-8 hover:bg-[#8B4434] hover:text-[#FCFAF7] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
              <span className="font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors duration-500 text-[#8B4434] group-hover:text-white">
                Find Professionals
              </span>
              <span className="font-serif italic text-2xl transition-transform duration-500 group-hover:translate-x-2 text-[#8B4434] group-hover:text-white">&rarr;</span>
            </Link>

            <Link href="/estimation" className="group flex items-center justify-between border border-[#8B4434] p-8 hover:bg-[#8B4434] hover:text-[#FCFAF7] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
              <span className="font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors duration-500 text-[#8B4434] group-hover:text-white">
                Start an Estimation
              </span>
              <span className="font-serif italic text-2xl transition-transform duration-500 group-hover:translate-x-2 text-[#8B4434] group-hover:text-white">&rarr;</span>
            </Link>

            <Link href="/bidding" className="group flex items-center justify-between border border-[#8B4434] p-8 hover:bg-[#8B4434] hover:text-[#FCFAF7] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
              <span className="font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors duration-500 text-[#8B4434] group-hover:text-white">
                Project Bidding Space
              </span>
              <span className="font-serif italic text-2xl transition-transform duration-500 group-hover:translate-x-2 text-[#8B4434] group-hover:text-white">&rarr;</span>
            </Link>

            <Link href="/marketplace" className="group flex items-center justify-between border border-[#8B4434] p-8 hover:bg-[#8B4434] hover:text-[#FCFAF7] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
              <span className="font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors duration-500 text-[#8B4434] group-hover:text-white">
                Material Marketplace
              </span>
              <span className="font-serif italic text-2xl transition-transform duration-500 group-hover:translate-x-2 text-[#8B4434] group-hover:text-white">&rarr;</span>
            </Link>
          </div>
        </main>
      </section>
    </div>
  )
}
