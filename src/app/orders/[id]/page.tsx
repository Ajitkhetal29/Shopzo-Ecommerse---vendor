"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api";
import { badgeClass, formatDate } from "../HubFulfillmentList";

type FulfillmentStatus =
  | "assigned"
  | "accepted"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

const STEPS: FulfillmentStatus[] = ["assigned", "accepted", "packed", "shipped", "delivered"];
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

type Detail = {
  _id: string;
  status: FulfillmentStatus;
  distanceKm?: number | null;
  expectedDeliveryDate?: string | null;
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
    orderStatus?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    deliveryInstructions?: string;
    deliveryAddress?: { formatted?: string; line1?: string; city?: string; pincode?: string };
    deliveryContact?: { name?: string; phone?: string };
    createdAt?: string;
  } | null;
};

export default function VendorOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [fulfillment, setFulfillment] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_ENDPOINTS.GET_FULFILLMENT_BY_ID}/${params.id}`, {
        withCredentials: true,
      });
      if (res.data.success) setFulfillment(res.data.fulfillment);
      else setError(res.data.message || "Failed to load order");
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStatus = async (status: FulfillmentStatus) => {
    if (!fulfillment) return;
    if (
      status === "cancelled" &&
      !window.confirm("Cancel this shipment? Stock will be released and we will try another hub.")
    ) {
      return;
    }
    setUpdating(true);
    try {
      const res = await axios.patch(
        `${API_ENDPOINTS.UPDATE_FULFILLMENT_STATUS}/${fulfillment._id}/status`,
        { status },
        { withCredentials: true },
      );
      toast.success(res.data?.message || `Marked as ${status}`);
      await fetchDetail();
    } catch (err: unknown) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const current = fulfillment ? STEPS.indexOf(fulfillment.status) : -1;

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm font-medium text-blue-600 hover:underline">
        ← Back to orders
      </Link>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {fulfillment && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">
                #{fulfillment.order?._id ? String(fulfillment.order._id).slice(-8).toUpperCase() : "-"} ·{" "}
                {formatDate(fulfillment.order?.createdAt)}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">Order details</h1>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeClass(fulfillment.status)}`}>
              {fulfillment.status}
            </span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-gray-500">Deliver to</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {fulfillment.order?.deliveryContact?.name || "-"}
              {fulfillment.order?.deliveryContact?.phone
                ? ` · ${fulfillment.order.deliveryContact.phone}`
                : ""}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {fulfillment.order?.deliveryAddress?.formatted ||
                [
                  fulfillment.order?.deliveryAddress?.line1,
                  fulfillment.order?.deliveryAddress?.city,
                  fulfillment.order?.deliveryAddress?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ") ||
                "-"}
            </p>
            {fulfillment.order?.deliveryInstructions ? (
              <p className="mt-2 text-sm text-gray-500">Note: {fulfillment.order.deliveryInstructions}</p>
            ) : null}
            <p className="mt-3 text-sm">ETA {formatDate(fulfillment.expectedDeliveryDate)}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="font-medium text-gray-900 dark:text-white">Timeline</p>
            <ol className="mt-4 space-y-2">
              {STEPS.map((step, idx) => (
                <li key={step} className="flex items-center gap-3 text-sm capitalize">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      fulfillment.status === "cancelled"
                        ? "bg-rose-400"
                        : idx <= current
                          ? "bg-black dark:bg-white"
                          : "bg-gray-300 dark:bg-slate-600"
                    }`}
                  />
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-2">
            {fulfillment.items.map((line, idx) => (
              <div
                key={`${fulfillment._id}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {line.variant?.images?.[0]?.url ? (
                    <Image src={line.variant.images[0].url} alt="" fill className="object-cover" unoptimized />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
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

          {NEXT_STATUSES[fulfillment.status].length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {NEXT_STATUSES[fulfillment.status].map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus(status)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                    status === "cancelled"
                      ? "border border-rose-300 text-rose-700"
                      : "bg-black text-white dark:bg-white dark:text-black"
                  }`}
                >
                  {updating ? "Updating..." : ACTION_LABEL[status]}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
