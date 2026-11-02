"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/app/lib/api";
import {
  NOTIFICATIONS_CHANGED,
  formatWhen,
  type ShopNotification,
} from "@/app/components/notifications/NotificationList";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<ShopNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.NOTIFICATIONS}/unread-count`, {
        withCredentials: true,
      });
      if (res.data?.success) setCount(Number(res.data.count) || 0);
    } catch {
      /* header stays quiet if the inbox cannot be reached */
    }
  }, []);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.NOTIFICATIONS, {
        withCredentials: true,
        params: { page: 1, limit: 6 },
      });
      if (res.data?.success) setItems(res.data.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCount();
    const timer = window.setInterval(() => void loadCount(), 30000);
    const onChange = () => void loadCount();
    window.addEventListener(NOTIFICATIONS_CHANGED, onChange);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChange);
    };
  }, [loadCount]);

  useEffect(() => {
    if (!open) return;
    void loadPreview();
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, loadPreview]);

  const badge = count > 99 ? "99+" : String(count);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        aria-expanded={open}
      >
        <BellIcon />
        {count > 0 ? (
          <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-sky-500 px-1 text-center text-[10px] font-semibold leading-4 text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-shop-border bg-shop-surface-raised shadow-lg">
          <div className="flex items-center justify-between border-b border-shop-border px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-shop-muted hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <p className="px-3 py-6 text-sm text-shop-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-shop-muted">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item._id} className="border-b border-shop-border last:border-b-0">
                  <Link
                    href={`/notifications/${item._id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className={`text-sm text-foreground ${item.read ? "font-medium" : "font-semibold"}`}>
                        {item.title}
                      </span>
                      {!item.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" /> : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-shop-muted">{item.body}</span>
                    <span className="mt-1 block text-[11px] text-shop-muted">{formatWhen(item.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0"
      />
    </svg>
  );
}
