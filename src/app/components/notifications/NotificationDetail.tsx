"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/app/lib/api";
import { formatWhen, notifyInboxChanged, typeLabel } from "@/app/components/notifications/NotificationList";

type RefRecord = {
  _id?: string;
  name?: string;
  email?: string;
  slug?: string;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  amount?: number;
  totalQuantity?: number;
};

type NotificationRecord = {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  user?: RefRecord | string | null;
  vendor?: RefRecord | string | null;
  warehouse?: RefRecord | string | null;
  deliveryAgent?: RefRecord | string | null;
  product?: RefRecord | string | null;
  order?: RefRecord | string | null;
  fulfillment?: RefRecord | string | null;
  deliveryJob?: RefRecord | string | null;
  refund?: RefRecord | string | null;
  transfer?: RefRecord | string | null;
};

type NotificationDetailProps = {
  id: string;
  orderHref?: (id: string) => string;
  jobHref?: (id: string) => string;
  productHref?: (record: RefRecord) => string | null;
};

const idOf = (value: RefRecord | string | null | undefined) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value._id ? String(value._id) : null;
};

const textOf = (value: RefRecord | string | null | undefined) => {
  if (!value || typeof value === "string") return null;
  if (value.name) return value.email ? `${value.name} · ${value.email}` : value.name;
  if (value.orderStatus) {
    const amount = value.totalAmount != null ? ` · ₹${value.totalAmount}` : "";
    return `${value.orderStatus}${value.paymentStatus ? ` / ${value.paymentStatus}` : ""}${amount}`;
  }
  if (value.amount != null) return `${value.status || "refund"} · ₹${value.amount}`;
  if (value.totalQuantity != null) return `${value.status || "transfer"} · ${value.totalQuantity} items`;
  if (value.status) return value.status;
  return null;
};

export default function NotificationDetail({
  id,
  orderHref,
  jobHref,
  productHref,
}: NotificationDetailProps) {
  const [notification, setNotification] = useState<NotificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`, {
          withCredentials: true,
        });
        if (!mounted) return;
        if (!res.data?.success || !res.data.notification) {
          setError(res.data?.message || "Notification not found");
          return;
        }
        const record = res.data.notification as NotificationRecord;
        setNotification(record);
        if (!record.read) {
          await axios.patch(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`, {}, { withCredentials: true });
          notifyInboxChanged();
          if (mounted) setNotification({ ...record, read: true });
        }
      } catch {
        if (mounted) setError("Notification not found");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-shop-muted">Loading notification…</p>;
  }

  if (error || !notification) {
    return (
      <div className="rounded-2xl border border-shop-border bg-shop-surface-raised p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error || "Notification not found"}</p>
        <Link href="/notifications" className="mt-4 inline-block text-sm font-medium text-foreground underline">
          Back to notifications
        </Link>
      </div>
    );
  }

  const orderId = idOf(notification.order);
  const jobId = idOf(notification.deliveryJob);
  const product = notification.product && typeof notification.product === "object" ? notification.product : null;
  const productLink = product && productHref ? productHref(product) : null;

  const facts = [
    ["Buyer", textOf(notification.user)],
    ["Vendor", textOf(notification.vendor)],
    ["Warehouse", textOf(notification.warehouse)],
    ["Delivery partner", textOf(notification.deliveryAgent)],
    ["Product", textOf(notification.product)],
    ["Order", textOf(notification.order)],
    ["Fulfillment", textOf(notification.fulfillment)],
    ["Delivery job", textOf(notification.deliveryJob)],
    ["Refund", textOf(notification.refund)],
    ["Transfer", textOf(notification.transfer)],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <article className="rounded-2xl border border-shop-border bg-shop-surface-raised shadow-sm">
      <div className="border-b border-shop-border px-5 py-5 sm:px-6">
        <Link href="/notifications" className="text-sm font-medium text-shop-muted hover:text-foreground">
          ← Notifications
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-shop-muted">
          {typeLabel(notification.type)}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{notification.title}</h1>
        <p className="mt-2 text-sm text-shop-muted">{formatWhen(notification.createdAt)}</p>
      </div>
      <div className="px-5 py-5 sm:px-6">
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{notification.body}</p>

        {facts.length > 0 ? (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-shop-border px-3 py-2.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-shop-muted">{label}</dt>
                <dd className="mt-1 text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {orderId && orderHref ? (
            <Link
              href={orderHref(orderId)}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Open order
            </Link>
          ) : null}
          {jobId && jobHref ? (
            <Link
              href={jobHref(jobId)}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Open delivery
            </Link>
          ) : null}
          {productLink ? (
            <Link
              href={productLink}
              className="rounded-full border border-shop-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              Open product
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
