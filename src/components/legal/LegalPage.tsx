import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo } from "@/components/ui/Logo";

export function contactEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
  return value.includes("@") ? value : null;
}

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo />
            <span className="text-xl font-semibold text-earth">Meditate</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm text-stone-500">Effective 27 September 2026</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-stone-700">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-stone-900">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
