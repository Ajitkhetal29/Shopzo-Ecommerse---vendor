"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Vendor } from "@/store/slices/authSlice";
import ThemeToggle from "@/app/components/ThemeToggle";
import { publicUrl } from "@/lib/basePath";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [profileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
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
    <div className="flex h-dvh w-full overflow-hidden bg-shop-surface text-foreground">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-shop-border bg-neutral-950 text-neutral-300 transition-[transform,width] duration-200 ease-out lg:z-30 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-[4.75rem] lg:w-[4.75rem]" : "w-[17.5rem] lg:w-72",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
          <Link
            href={brandHref}
            className={`flex min-w-0 flex-1 items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            onClick={() => setMobileNavOpen(false)}
          >
            {collapsed ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-shop-accent text-sm font-bold text-white">
                S
              </span>
            ) : (
              <Image
                src={publicUrl("/shopzo_logo_tp.png")}
                alt="Shopzo"
                width={110}
                height={36}
                className="h-7 w-auto object-contain"
                priority
              />
            )}
          </Link>
        </div>

        {!collapsed ? (
          <p className="px-5 pt-4 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Seller portal
          </p>
        ) : null}

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = linkActive(item.href);
              return (
                <li key={`${item.href}-${item.label}`} className="relative">
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-400 hover:bg-white/[0.07] hover:text-white",
                      collapsed ? "justify-center px-2.5" : "",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && !collapsed ? (
                      <span
                        className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-shop-accent"
                        aria-hidden
                      />
                    ) : null}
                    <NavIcon href={item.href} label={item.label} active={active} />
                    <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 px-3 py-4">
          {!collapsed ? (
            <div className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Active seller
              </p>
              <p className="mt-1 truncate text-sm font-medium text-neutral-200">{vendor.name}</p>
            </div>
          ) : null}
        </div>
      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${collapsed ? "lg:ml-[4.75rem]" : "lg:ml-72"}`}
      >
        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-2 border-b border-shop-border bg-shop-surface-raised/90 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-5">
          <button
            type="button"
            className="rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 pl-0.5">
            <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Vendor workspace
            </p>
            <p className="truncate text-xs text-shop-muted sm:text-sm">Products, inventory & transfers</p>
          </div>

          <div className="hidden lg:flex lg:w-[19rem]">
            <label className="relative block w-full">
              <span className="sr-only">Search products</span>
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-shop-muted" />
              <input
                type="search"
                placeholder="Search products, SKUs…"
                className="h-10 w-full rounded-full border border-shop-border bg-shop-surface py-2 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-shop-muted focus:border-neutral-400 focus:bg-shop-surface-raised dark:focus:border-neutral-600"
              />
            </label>
          </div>

          <ThemeToggle />

          <div ref={profileRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              {vendor.name.charAt(0).toUpperCase()}
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-shop-border bg-shop-surface-raised p-1.5 shadow-lg">
                <div className="border-b border-shop-border px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">{vendor.name}</p>
                  {vendor.email ? (
                    <p className="truncate text-xs text-shop-muted">{vendor.email}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    void onLogout();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="shrink-0 rounded-full border border-shop-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:hidden"
          >
            Log out
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-shop-surface">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ href, label, active }: { href: string; label: string; active: boolean }) {
  const c = `h-5 w-5 shrink-0 ${active ? "text-neutral-900" : "text-neutral-500 group-hover:text-shop-accent"}`;
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CollapseIcon({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function IconWarehouse({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IconShopping({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconArrows({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l3-3 3 2 5-6" />
    </svg>
  );
}

function IconCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
