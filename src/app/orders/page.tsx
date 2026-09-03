"use client";

import HubFulfillmentList from "./HubFulfillmentList";

export default function OrdersPage() {
  return (
    <HubFulfillmentList
      scope="open"
      title="Orders"
      subtitle="Open fulfillments assigned to you"
    />
  );
}
