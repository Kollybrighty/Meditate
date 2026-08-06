import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { BookOpen, Users, Headphones, Baby } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xl font-semibold text-earth">Meditate</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <Logo className="mx-auto h-20 w-20" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-earth sm:text-5xl">
            Read together. Grow together.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600">
            Group Bible study with reading plans, daily progress tracking,
            offline audio, Q&amp;A forums, and a Kids classroom section.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Create free account</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-stone-200 bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={<BookOpen className="h-6 w-6 text-gold" />}
              title="Reading plans"
              description="Genesis to Revelation, OT, NT, or chronological — 3, 6, or 12 months."
            />
            <Feature
              icon={<Headphones className="h-6 w-6 text-gold" />}
              title="Audio & offline"
              description="Listen online or offline. Complete daily reading without connectivity."
            />
            <Feature
              icon={<Users className="h-6 w-6 text-gold" />}
              title="Group study"
              description="Admins create groups, share invite links, track daily progress together."
            />
            <Feature
              icon={<Baby className="h-6 w-6 text-gold" />}
              title="Kids classrooms"
              description="Teachers host lessons, Bible characters, quizzes, and safe student messaging."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} Meditate — Bible study for every generation.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-stone-100 p-6 shadow-sm">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </div>
  );
}
