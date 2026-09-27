import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
        <Logo className="h-14 w-14" />
        <p className="mt-6 text-sm font-medium text-gold">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">Page not found</h1>
        <p className="mt-3 text-stone-600">
          That link does not match a page in Meditate. It may have been moved, or the address was typed wrong.
        </p>
        <Link href="/" className="mt-6">
          <Button>Back home</Button>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
