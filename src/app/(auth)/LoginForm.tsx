"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn, type AuthActionState } from "./actions";

const initialState: AuthActionState = {};

export default function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const registerHref = nextPath
    ? `/register?next=${encodeURIComponent(nextPath)}`
    : "/register";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo className="h-12 w-12" />
            <span className="text-2xl font-semibold text-earth">Meditate</span>
          </Link>
          <p className="mt-2 text-stone-600">Sign in to your account</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Password
            </label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-stone-600">
            <Link href="/forgot-password" className="font-medium text-gold hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-center text-sm text-stone-600">
            No account?{" "}
            <Link href={registerHref} className="font-medium text-gold hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
