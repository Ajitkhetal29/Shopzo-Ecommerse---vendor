"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/app/lib/api";

export const NOTIFICATIONS_CHANGED = "shopzo-notifications-changed";

export type ShopNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function notifyInboxChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export function formatWhen(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function typeLabel(type: string) {
  return type.replace(/_/g, " ");
}

type ListResponse = {
  success: boolean;
  notifications?: ShopNotification[];
  page?: number;
  totalPages?: number;
  total?: number;
  message?: string;
};

export default function NotificationList() {
  const [items, setItems] = useState<ShopNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<ListResponse>(API_ENDPOINTS.NOTIFICATIONS, {
        withCredentials: true,
        params: { page, limit: 20, unread: unreadOnly ? "true" : undefined },
      });
      if (!res.data.success) {
        setError(res.data.message || "Could not load notifications");
        setItems([]);
        return;
      }
      setItems(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setError("Could not load notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAll = async () => {
    setMarking(true);
    try {
      await axios.patch(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`, {}, { withCredentials: true });
      notifyInboxChanged();
      if (unreadOnly) {
        setItems([]);
        setTotal(0);
      } else {
        setItems((current) => current.map((item) => ({ ...item, read: true })));
      }
    } catch {
      setError("Could not mark notifications as read");
    } finally {
      setMarking(false);
    }
  };

  return (
    <section className="rounded-2xl border border-shop-border bg-shop-surface-raised shadow-sm">
      <div className="flex flex-col gap-3 border-b border-shop-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-shop-muted">
            {total} {total === 1 ? "update" : "updates"}
            {unreadOnly ? " unread" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setUnreadOnly((current) => !current);
            }}
            className="rounded-full border border-shop-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {unreadOnly ? "Show all" : "Unread only"}
          </button>
          <button
            type="button"
            onClick={() => void markAll()}
            disabled={marking || items.every((item) => item.read)}
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {marking ? "Marking…" : "Mark all read"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="px-5 py-10 text-sm text-shop-muted">Loading notifications…</p>
      ) : error ? (
        <p className="px-5 py-10 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="px-5 py-10 text-sm text-shop-muted">No notifications yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item._id} className="border-b border-shop-border last:border-b-0">
              <Link
                href={`/notifications/${item._id}`}
                className="flex gap-3 px-5 py-4 transition hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.read ? "bg-transparent" : "bg-sky-500"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className={`text-sm text-foreground ${item.read ? "font-medium" : "font-semibold"}`}>
                      {item.title}
                    </span>
                    <span className="text-xs text-shop-muted">{formatWhen(item.createdAt)}</span>
                  </span>
                  <span className="mt-1 block text-sm text-shop-muted">{item.body}</span>
                  <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-shop-muted">
                    {typeLabel(item.type)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-full border border-shop-border px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-sm text-shop-muted">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full border border-shop-border px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
