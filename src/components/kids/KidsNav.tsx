import Link from "next/link";
import { Baby } from "lucide-react";
import NotificationBell from "@/components/nav/NotificationBell";

export default function KidsNav() {
  return (
    <div className="border-b border-sky-200 bg-white px-6 py-2">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/kids" className="inline-flex items-center gap-2 text-sm font-medium text-sky-800">
          <Baby className="h-4 w-4" />
          Meditate Kids
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-stone-600 hover:text-sky-800">
            Dashboard
          </Link>
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
