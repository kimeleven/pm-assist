"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/company/dashboard", label: "신고 현황 지도", icon: "🗺️" },
  { href: "/company/reports", label: "조치결과 등록", icon: "✅" },
];

export default function CompanySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="text-lg font-bold">🛴 PM업체 포털</div>
        <div className="text-xs text-gray-400 mt-0.5">인천광역시 공유PM 관리</div>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
              pathname === item.href
                ? "bg-green-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}
