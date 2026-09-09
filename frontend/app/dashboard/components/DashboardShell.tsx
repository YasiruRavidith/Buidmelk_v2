"use client";

import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { ShieldCheck, ChevronRight, User } from "lucide-react";

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
  const { user, profilePhoto } = useAuth();

  const sections = navSections.length > 0 ? navSections : [{ title: "Navigation", items: navItems }];

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const avatarUrl = profilePhoto || user?.photoURL;

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#281713]">
      <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-10 items-start">
          {/* Sidebar */}
          <aside className="bg-white border border-[#efe6df] rounded-none p-6 space-y-8 shadow-xs sticky top-24">
            {/* User Profile Box */}
            <div className="flex flex-col items-center text-center p-4 bg-[#fcfaf9] border border-[#efe6df] rounded-none">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#8B4434]/30 shadow-xs flex items-center justify-center bg-[#f3ebe4]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#8B4434]" />
                )}
              </div>

              <div className="mt-3 w-full">
                <h3 className="font-serif text-base font-semibold text-[#281713] truncate">{displayName}</h3>
                <p className="text-xs text-[#606060] truncate">{user?.email || "Signed In"}</p>
              </div>
            </div>

            {/* Navigation Sections */}
            <nav className="space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#8B4434]/70 font-bold px-1">
                    {section.title}
                  </p>
                  <div className="space-y-1.5">
                    {section.items.map((item) => {
                      const activeClass = item.isActive
                        ? "bg-[#fff7ed] border-l-4 border-[#8B4434] text-[#8B4434] font-semibold pl-3 pr-4"
                        : "bg-white border-l-4 border-transparent text-[#606060] hover:bg-[#fcfaf9] hover:text-[#281713] pl-3 pr-4";
                      const disabledClass = item.disabled ? "opacity-50 pointer-events-none" : "";

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block py-3 text-xs transition-all border border-[#efe6df]/60 ${activeClass} ${disabledClass}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{item.label}</span>
                            <ChevronRight className={`w-3.5 h-3.5 opacity-40 ${item.isActive ? "text-[#8B4434] opacity-100" : ""}`} />
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-stone-500 mt-0.5 font-normal line-clamp-1">{item.description}</div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Help / Quick Badge */}
            <div className="p-4 bg-[#f8f4f0] border border-[#efe6df] rounded-none space-y-2">
              <div className="flex items-center gap-2 text-[#8B4434]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">Account Verified</span>
              </div>
              <p className="text-[11px] text-[#606060] leading-relaxed">
                Your account is active. Update your public profile and details from the Profile menu.
              </p>
            </div>
          </aside>

          {/* Main Dashboard Workspace */}
          <main className="space-y-8 bg-transparent min-w-0 w-full">{children}</main>
        </div>
      </div>
    </div>
  );
}
