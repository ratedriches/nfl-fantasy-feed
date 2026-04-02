"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavTabs() {
  const pathname = usePathname();
  const isStats = pathname.startsWith("/stats");

  return (
    <div className="flex border-b border-gray-800 bg-gray-900">
      <Link
        href="/"
        className={`px-5 py-3 text-sm font-medium transition-colors ${
          !isStats
            ? "border-b-2 border-white text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Beat Writers
      </Link>
      <Link
        href="/stats"
        className={`px-5 py-3 text-sm font-medium transition-colors ${
          isStats
            ? "border-b-2 border-white text-white"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        NFL Stats
      </Link>
    </div>
  );
}
