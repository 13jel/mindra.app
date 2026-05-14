"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function BackButton({ ariaLabel }: { ariaLabel: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from");

  const onClick = () => {
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      router.push(`/today?date=${from}`);
      return;
    }
    if (typeof window !== "undefined" && window.history.length <= 1) {
      router.push("/today");
      return;
    }
    router.back();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="text-fg-muted hover:text-fg"
    >
      ←
    </button>
  );
}