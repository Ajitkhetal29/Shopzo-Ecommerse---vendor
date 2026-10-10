"use client";

import HubFulfillmentList from "../orders/HubFulfillmentList";

export default function DeliveriesPage() {
  return (
    <HubFulfillmentList
      scope="dispatch"
      title="Deliveries"
      subtitle="Packed jobs and the rider who claimed them"
    />
  );
}
