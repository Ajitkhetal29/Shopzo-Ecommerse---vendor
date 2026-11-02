"use client";

import { useParams } from "next/navigation";
import NotificationDetail from "@/app/components/notifications/NotificationDetail";

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  return <NotificationDetail id={params.id} orderHref={(orderId) => `/orders/${orderId}`} />;
}
