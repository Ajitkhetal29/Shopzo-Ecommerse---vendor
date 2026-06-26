"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Vendor } from "@/store/slices/authSlice";
import ThemeToggleButton from "@/app/components/ThemeToggleButton";

const SIDEBAR_KEY = "shopzo-vendor-sidebar-collapsed";

type NavItem = { label: string; href: string };

type AppShellProps = {
  children: React.ReactNode;
  menuItems: NavItem[];
  vendor: Vendor;
  brandHref: string;
  onLogout: () => void | Promise<void>;
};

export default function AppShell({ children, menuItems, vendor, brandHref, onLogout }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const linkActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-[17.5rem] flex-col border-r border-slate-200/90 bg-white text-slate-700 transition-[transform,width] duration-200 ease-out dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 lg:z-30 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[4rem]" : "lg:w-72",
        ].join(" ")}
      >
        <div className="flex h-[3.75rem] shrink-0 items-center border-b border-slate-200/90 px-4 dark:border-white/10">
          <div className={`flex min-w-0 flex-1 items-center ${collapsed ? "justify-center px-0" : ""}`}>
            <Link
              href={brandHref}
              className="truncate leading-tight tracking-tight text-slate-900 dark:text-white"
              onClick={() => setMobileNavOpen(false)}
            >
              {collapsed ? (
                <span className="text-xl font-bold text-amber-400">S</span>
              ) : (
                <span className="text-[0.9375rem] font-semibold sm:text-base">
                  <span className="text-amber-400">Shopzo</span>
                  <span className="font-medium text-slate-400 dark:text-slate-500"> · Vendor</span>
                </span>
              )}
            </Link>
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2.5 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = linkActive(item.href);
              return (
                <li key={`${item.href}-${item.label}`} className="relative">
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-[0.875rem] font-medium leading-snug transition-colors sm:text-[0.925rem]",
                      active
                        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100",
                      collapsed ? "justify-center px-2.5 py-3" : "",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && !collapsed ? (
                      <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-amber-500" aria-hidden />
                    ) : null}
                    <NavIcon href={item.href} label={item.label} active={active} className="h-5 w-5 shrink-0 sm:h-[1.325rem] sm:w-[1.325rem]" />
                    <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-slate-200 px-3 py-2.5 dark:border-white/10">
          {!collapsed ? (
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
              Seller portal
            </p>
          ) : null}
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${collapsed ? "lg:ml-[4rem]" : "lg:ml-72"}`}>
        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900 sm:gap-3 sm:px-5">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 pl-0.5">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Vendor workspace</p>
            <p className="truncate text-sm leading-snug text-slate-500 dark:text-slate-400">
              Products, inventory & transfers
            </p>
          </div>

          <div className="hidden lg:flex lg:w-[19rem]">
            <label className="relative block w-full">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                placeholder="Search products, SKUs…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[0.9375rem] text-slate-700 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-amber-400/50"
              />
            </label>
          </div>

          <ThemeToggleButton
            className={[
              "shrink-0 rounded-full border p-2 text-slate-600 transition-colors",
              "border-slate-200/90 bg-white hover:bg-slate-50",
              "dark:border-slate-600 dark:bg-slate-800 dark:text-amber-100/90 dark:hover:bg-slate-700",
            ].join(" ")}
          />

          <div className="hidden min-w-0 items-center gap-3 sm:flex md:gap-4">
            <div className="min-w-0 text-right">
              <p className="truncate text-[0.9375rem] font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</p>
              {vendor.email ? (
                <p className="max-w-[16rem] truncate text-xs leading-snug text-slate-500 dark:text-slate-400">{vendor.email}</p>
              ) : null}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-800 dark:text-amber-200">
              {vendor.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-[0.8125rem] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4 sm:text-sm"
          >
            Log out
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ href, label, active, className }: { href: string; label: string; active: boolean; className?: string }) {
  const c = [className, active ? "text-amber-600 dark:text-amber-300" : "text-slate-400 dark:text-amber-400/80"]
    .filter(Boolean)
    .join(" ");
  const lower = label.toLowerCase();
  if (lower.includes("dashboard")) return <IconLayoutDashboard className={c} />;
  if (href.includes("/products")) return <IconShopping className={c} />;
  if (href.includes("/inventory") && !href.includes("Transfer")) return <IconWarehouse className={c} />;
  if (href.includes("TransferInventory")) return <IconArrows className={c} />;
  if (href.includes("TransferIssues")) return <IconAlert className={c} />;
  if (href.includes("/orders")) return <IconClipboard className={c} />;
  if (lower.includes("team")) return <IconUsers className={c} />;
  if (lower.includes("history")) return <IconChart className={c} />;
  return <IconCircle className={c} />;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CollapseIcon({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      {collapsed ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      )}
    </svg>
  );
}

function IconLayoutDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconWarehouse({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IconShopping({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l3-3 3 2 5-6" />
    </svg>
  );
}

function IconCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
