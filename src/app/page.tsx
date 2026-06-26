"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
    </div>
  );
}
