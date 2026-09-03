"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api";
import { RootState } from "@/store";

type FulfillmentStatus =
  | "assigned"
  | "accepted"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

type Fulfillment = {
  _id: string;
  status: FulfillmentStatus;
  distanceKm?: number | null;
  expectedDeliveryDate?: string | null;
  createdAt?: string;
  items: {
    quantity: number;
    variant?: {
      sku?: string;
      size?: string;
      color?: string;
      images?: { url?: string }[];
      product?: { name?: string } | null;
    } | null;
  }[];
  order?: {
    _id: string;
    totalAmount?: number;
    paymentMethod?: string;
    deliveryAddress?: { formatted?: string; line1?: string; city?: string; pincode?: string };
    deliveryContact?: { name?: string; phone?: string };
    createdAt?: string;
  } | null;
};

const PAGE_SIZE = 10;
const NEXT_STATUSES: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  assigned: ["accepted", "cancelled"],
  accepted: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
const ACTION_LABEL: Record<FulfillmentStatus, string> = {
  assigned: "Assigned",
  accepted: "Accept",
  packed: "Mark packed",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  cancelled: "Cancel",
};

export const badgeClass = (status: string) => {
  switch (status) {
    case "assigned":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "accepted":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "packed":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "shipped":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    case "delivered":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300";
    case "cancelled":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  }
};

export const formatDate = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

const formatAddress = (address?: {
  formatted?: string;
  line1?: string;
  city?: string;
  pincode?: string;
}) => {
  if (!address) return "-";
  return address.formatted || [address.line1, address.city, address.pincode].filter(Boolean).join(", ") || "-";
};

export default function HubFulfillmentList({
  scope,
  title,
  subtitle,
}: {
  scope: "open" | "history";
  title: string;
  subtitle: string;
}) {
  const vendor = useSelector((state: RootState) => state.auth.vendor);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const tabs = scope === "history" ? ["all", "delivered", "cancelled"] : ["all", "assigned", "accepted", "packed", "shipped"];

  useEffect(() => setPage(1), [vendor?._id, tab, scope]);

  const fetchFulfillments = useCallback(async () => {
    if (!vendor?._id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_ENDPOINTS.GET_FULFILLMENTS, {
        withCredentials: true,
        params: { status: tab, scope, page, limit: PAGE_SIZE },
      });
      if (response.data.success) {
        setFulfillments(response.data.fulfillments ?? []);
        setTotalPages(Math.max(1, Number(response.data.totalPages) || 1));
        setTotalCount(Number(response.data.totalCount) || 0);
      }
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Failed to fetch orders",
      );
    } finally {
      setLoading(false);
    }
  }, [vendor?._id, tab, page, scope]);

  useEffect(() => {
    fetchFulfillments();
  }, [fetchFulfillments]);

  const updateStatus = async (id: string, status: FulfillmentStatus) => {
    if (
      status === "cancelled" &&
      !window.confirm("Cancel this shipment? Stock will be released and we will try another hub.")
    ) {
      return;
    }
    setUpdatingId(id);
    try {
      const res = await axios.patch(
        `${API_ENDPOINTS.UPDATE_FULFILLMENT_STATUS}/${id}/status`,
        { status },
        { withCredentials: true },
      );
      toast.success(res.data?.message || `Marked as ${status}`);
      await fetchFulfillments();
    } catch (err: unknown) {
      toast.error(
        axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Failed to update status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (!vendor?._id || (loading && fulfillments.length === 0)) {
    return (
      <div className="flex items-center justify-center py-16 text-lg text-gray-600 dark:text-gray-400">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-gray-300 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {fulfillments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300">
          No orders found
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fulfillments.map((f) => (
            <div
              key={f._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Placed: {formatDate(f.order?.createdAt || f.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    #{f.order?._id ? String(f.order._id).slice(-8).toUpperCase() : "-"}
                    {f.order?.paymentMethod ? ` · ${f.order.paymentMethod}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClass(f.status)}`}>
                  {f.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900/30 md:col-span-2">
                  <p className="text-gray-500">Deliver to</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {f.order?.deliveryContact?.name || "-"}
                    {f.order?.deliveryContact?.phone ? ` · ${f.order.deliveryContact.phone}` : ""}
                  </p>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formatAddress(f.order?.deliveryAddress)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900/30">
                  <p className="text-gray-500">ETA</p>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{formatDate(f.expectedDeliveryDate)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {f.items.map((line, idx) => (
                  <div
                    key={`${f._id}-${idx}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-slate-700"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-slate-700">
                      {line.variant?.images?.[0]?.url ? (
                        <Image src={line.variant.images[0].url} alt="" fill className="object-cover" unoptimized />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-slate-100">
                        {line.variant?.product?.name || line.variant?.sku || "Product"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {line.variant?.sku}
                        {line.variant?.size ? ` · ${line.variant.size}` : ""}
                        {" · Qty "}
                        {line.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Link
                  href={`/orders/${f._id}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-slate-600"
                >
                  View details
                </Link>
                {scope === "open" &&
                  NEXT_STATUSES[f.status].map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === f._id}
                      onClick={() => updateStatus(f._id, status)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                        status === "cancelled"
                          ? "border border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-300"
                          : "bg-black text-white dark:bg-white dark:text-black"
                      }`}
                    >
                      {updatingId === f._id ? "Updating..." : ACTION_LABEL[status]}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages} · {totalCount} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-600"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
