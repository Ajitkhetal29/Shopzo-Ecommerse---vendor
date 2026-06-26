"use client";

import React from "react";
import Link from "next/link";

const VendorDashboardPage = () => {
  const stats = [
    { name: "Total Products", value: "0", icon: "🛍️", href: "/products", iconWrap: "bg-sky-100 dark:bg-sky-500/20" },
    { name: "Active Orders", value: "0", icon: "📦", href: "/orders", iconWrap: "bg-amber-100 dark:bg-amber-500/20" },
    { name: "Revenue Today", value: "₹0", icon: "💰", href: "/orders", iconWrap: "bg-emerald-100 dark:bg-emerald-500/20" },
    { name: "Stock Items", value: "—", icon: "🏭", href: "/inventory", iconWrap: "bg-violet-100 dark:bg-violet-500/20" },
  ];

  const quickActions = [
    { name: "Manage Products", href: "/products", icon: "🛍️" },
    { name: "View Inventory", href: "/inventory", icon: "🏭" },
    { name: "Transfer Stock", href: "/TransferInventory", icon: "↔️" },
    { name: "Transfer Issues", href: "/TransferIssues", icon: "⚠️" },
    { name: "View Orders", href: "/orders", icon: "📋" },
    { name: "Sales History", href: "/History", icon: "📊" },
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2.05rem] lg:text-[2.2rem] lg:leading-tight">
          Vendor dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Track product performance, active order volume, and inventory health from a single view.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-amber-500/35 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/90"
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.iconWrap} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg`}>
                  <span aria-hidden>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    {stat.name}
                  </p>
                  <p className="mt-1 text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Quick actions</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Common vendor workflows</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex min-h-[3.25rem] items-center rounded-xl border border-slate-200/80 px-3 py-3 transition-colors hover:border-amber-500/40 hover:bg-amber-50/80 dark:border-slate-700 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/10 sm:px-4"
            >
              <span className="mr-3 text-xl" aria-hidden>
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Recent orders</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Latest order activity</p>
        <div className="rounded-xl border border-dashed border-slate-200/90 py-14 text-center dark:border-slate-600/80">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No recent orders to display</p>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
