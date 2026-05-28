"use client";

import Link from "next/link";

export type DashboardNavItem = {
  label: string;
  href: string;
  description?: string;
  isActive?: boolean;
  disabled?: boolean;
};

export type DashboardNavSection = {
  title: string;
  items: DashboardNavItem[];
};

type DashboardShellProps = {
  navItems?: DashboardNavItem[];
  navSections?: DashboardNavSection[];
  children: React.ReactNode;
};

export default function DashboardShell({ navItems = [], navSections = [], children }: DashboardShellProps) {
  const sections = navSections.length > 0 ? navSections : [{ title: 'Navigation', items: navItems }];

  return (
    <div className="min-h-screen bg-(--color-base)">
      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="bg-white border border-[#efe6df] rounded-none p-6 h-fit shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-[#8B4434]/60">Dashboard</p>
            <h2 className="font-serif text-2xl text-[#281713]">Workspace</h2>
            <p className="text-sm text-[#606060] mt-2">Manage your profile and activity.</p>
          </div>
          <nav className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8B4434]/60 font-semibold px-1">{section.title}</p>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const baseClass = "block rounded-none px-4 py-3 text-sm transition border";
                    const activeClass = item.isActive
                      ? "bg-[#fff7ed] border-[#f3d8cf] text-[#8B4434]"
                      : "bg-white border-transparent text-[#606060] hover:border-[#efe6df] hover:bg-[#fcfaf9]";
                    const disabledClass = item.disabled ? "opacity-50 pointer-events-none" : "";

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${baseClass} ${activeClass} ${disabledClass}`}
                      >
                        <div className="font-semibold text-sm">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-stone-500 mt-1">{item.description}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main className="space-y-8 bg-transparent">{children}</main>
      </div>
    </div>
  );
}
