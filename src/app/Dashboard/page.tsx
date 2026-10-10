"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/app/lib/api";
import { vendorCard, vendorPageHeader, vendorSubtitle, vendorTitle } from "@/lib/vendor-ui";
import { RootState } from "@/store";

type DashboardStats = {
  openCount?: number;
  claimedCount?: number;
  waitingCount?: number;
  deliveredToday?: number;
  revenueToday?: number;
  inventorySkus?: number;
  totalProducts?: number;
  recent?: {
    _id: string;
    status: string;
    createdAt?: string;
    delivery?: {
      status?: string;
      rider?: { name?: string | null; shopzoDeliveryId?: string | null } | null;
    } | null;
  }[];
};

const QUICK_ACTIONS = [
  { name: "Manage Products", href: "/products", icon: "🛍️" },
  { name: "View Inventory", href: "/inventory", icon: "🏭" },
  { name: "Transfer Stock", href: "/TransferInventory", icon: "↔️" },
  { name: "Transfer Issues", href: "/TransferIssues", icon: "⚠️" },
  { name: "View Orders", href: "/orders", icon: "📋" },
  { name: "Deliveries", href: "/deliveries", icon: "🚚" },
  { name: "Sales History", href: "/History", icon: "📊" },
];

export default function VendorDashboardPage() {
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!vendor?._id) return;
    let cancelled = false;
    axios
      .get(API_ENDPOINTS.GET_FULFILLMENT_STATS, { withCredentials: true })
      .then((res) => {
        if (!cancelled && res.data?.success) setStats(res.data.data || {});
      })
      .catch(() => {
        if (!cancelled) setStats({});
      });
    return () => {
      cancelled = true;
    };
  }, [vendor?._id]);

  const cards = [
    {
      name: "Total Products",
      value: String(stats?.totalProducts ?? "—"),
      icon: "🛍️",
      href: "/products",
      iconWrap: "bg-sky-100 dark:bg-sky-500/20",
    },
    {
      name: "Active Orders",
      value: String(stats?.openCount ?? "—"),
      icon: "📦",
      href: "/orders",
      iconWrap: "bg-amber-100 dark:bg-amber-500/20",
    },
    {
      name: "Rider claimed",
      value: String(stats?.claimedCount ?? "—"),
      icon: "🚚",
      href: "/deliveries",
      iconWrap: "bg-lime-100 dark:bg-lime-500/20",
    },
    {
      name: "Revenue Today",
      value: `₹${Number(stats?.revenueToday || 0).toLocaleString()}`,
      icon: "💰",
      href: "/orders",
      iconWrap: "bg-emerald-100 dark:bg-emerald-500/20",
    },
    {
      name: "Stock Items",
      value: String(stats?.inventorySkus ?? "—"),
      icon: "🏭",
      href: "/inventory",
      iconWrap: "bg-violet-100 dark:bg-violet-500/20",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className={vendorPageHeader}>
        <h1 className={vendorTitle}>Vendor dashboard</h1>
        <p className={vendorSubtitle}>
          Track product performance, active order volume, and inventory health from a single view.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-shop-muted">Key metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className={`${vendorCard} p-5 transition hover:-translate-y-0.5 hover:border-shop-accent/35 hover:shadow-md`}
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.iconWrap} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg`}>
                  <span aria-hidden>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-shop-muted">{stat.name}</p>
                  <p className="mt-1 text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-foreground">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={`${vendorCard} p-5 sm:p-6`}>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Quick actions</h2>
        <p className="mb-4 mt-1 text-sm text-shop-muted">Common vendor workflows</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex min-h-[3.25rem] items-center rounded-xl border border-shop-border px-3 py-3 transition hover:border-shop-accent/40 hover:bg-shop-accent/5 sm:px-4"
            >
              <span className="mr-3 text-xl" aria-hidden>
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-foreground">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className={`${vendorCard} p-5 sm:p-6`}>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Recent deliveries</h2>
        <p className="mb-4 mt-1 text-sm text-shop-muted">
          Latest rider activity · {stats?.waitingCount ?? 0} still waiting
        </p>
        {!stats?.recent?.length ? (
          <div className="rounded-xl border border-dashed border-shop-border py-14 text-center">
            <p className="text-sm font-medium text-shop-muted">No packed jobs yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {stats.recent.map((row) => {
              const rider = row.delivery?.rider;
              const job =
                row.delivery?.status === "in_transit"
                  ? "To customer"
                  : row.delivery?.status === "at_pickup"
                    ? "At pickup"
                    : row.delivery?.status === "initiated"
                      ? "Started"
                      : row.delivery?.status === "in_queue"
                        ? "Rider accepted"
                        : "Waiting for rider";
              return (
                <li
                  key={row._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-shop-border px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">#{String(row._id).slice(-8).toUpperCase()}</p>
                    <p className="truncate text-xs text-shop-muted">
                      {rider
                        ? `${rider.name || "Rider"}${rider.shopzoDeliveryId ? ` · ${rider.shopzoDeliveryId}` : ""}`
                        : job}
                    </p>
                  </div>
                  <span className="shrink-0 capitalize text-shop-muted">{job}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
