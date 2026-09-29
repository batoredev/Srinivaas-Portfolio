"use client";

import { useRouter } from "next/navigation";

/** Returns the visitor to wherever they came from, so a 404 never picks a mode for them. */
export function GoBack({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
    >
      Go back
    </button>
  );
}
