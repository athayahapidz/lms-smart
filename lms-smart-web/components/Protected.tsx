"use client";

import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { isLoggedIn } from "@/lib/auth";

export default function Protected({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
    }
  }, [router]);

  return <>{children}</>;
}