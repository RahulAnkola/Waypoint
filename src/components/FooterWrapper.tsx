"use client";

import { usePathname } from "next/navigation";
import HomeFooter from "./HomeFooter";

const EXCLUDED = ["/planner", "/auth"];

export default function FooterWrapper() {
  const pathname = usePathname();
  if (EXCLUDED.some(p => pathname?.startsWith(p))) return null;
  return <HomeFooter />;
}
