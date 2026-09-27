import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
      <p>© {new Date().getFullYear()} Meditate — Bible study for every generation.</p>
      <p className="mt-2 flex justify-center gap-4">
        <Link href="/privacy" className="hover:text-stone-800 hover:underline">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-stone-800 hover:underline">
          Terms
        </Link>
      </p>
    </footer>
  );
}
