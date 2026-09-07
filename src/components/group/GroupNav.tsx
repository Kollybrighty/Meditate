"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = (groupId: string) => [
  { href: `/groups/${groupId}`, label: "Group", match: "exact" as const },
  {
    href: `/groups/${groupId}/read`,
    label: "Today's reading",
    match: "prefix" as const,
    icon: BookOpen,
  },
  {
    href: `/groups/${groupId}/members`,
    label: "Members",
    match: "prefix" as const,
    icon: Users,
  },
  {
    href: `/groups/${groupId}/forum`,
    label: "Q&A forum",
    match: "prefix" as const,
    icon: MessageCircle,
  },
];

export default function GroupNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {links(groupId).map((link) => {
        const active =
          link.match === "exact"
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = "icon" in link ? link.icon : null;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-gold text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-earth"
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
