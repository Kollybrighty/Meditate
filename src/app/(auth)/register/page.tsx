"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUp, type AuthActionState } from "@/app/(auth)/actions";

const initialState: AuthActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo className="h-12 w-12" />
            <span className="text-2xl font-semibold text-earth">Meditate</span>
          </Link>
          <p className="mt-2 text-stone-600">Create your account</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          {state.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
              Full name
            </label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium">
              Preferred username
            </label>
            <Input id="username" name="username" required />
          </div>
          <div>
            <label htmlFor="church" className="mb-1 block text-sm font-medium">
              Local church
            </label>
            <Input id="church" name="church" />
          </div>
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
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-stone-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
