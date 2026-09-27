"use server";

import "@/lib/supabase/tls-dev";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authErrorMessage } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/safe-path";
import { appBaseUrl } from "@/lib/app-url";
import { isResendConfigured, passwordResetContent, sendEmail } from "@/lib/email/resend";
import { logAppError } from "@/lib/errors/report";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signUp(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const fullName = formData.get("fullName") as string;
    const church = formData.get("church") as string;
    if (formData.get("agree") !== "on") {
      return { error: "Agree to the Terms and Privacy Policy to create an account." };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          church,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      return { error: authErrorMessage(error) };
    }
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  redirect(safeNextPath(formData.get("next")) ?? "/dashboard");
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: authErrorMessage(error) };
    }
  } catch (error) {
    return { error: authErrorMessage(error) };
  }

  redirect(safeNextPath(formData.get("next")) ?? "/dashboard");
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Still leave the page if sign-out cannot reach Supabase.
  }
  redirect("/");
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = (formData.get("email") as string | null)?.trim();
  if (!email) return { error: "Enter the email for your account." };

  try {
    const origin = await appBaseUrl();
    const redirectTo = `${origin}/auth/callback?next=/reset-password`;
    const sent = await sendPasswordResetEmail(email, redirectTo);
    if (sent === "sent" || sent === "unknown-user") {
      return {
        success:
          "If that email is registered, we sent a link to choose a new password.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) return { error: authErrorMessage(error) };
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  return {
    success:
      "If that email is registered, we sent a link to choose a new password.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return { error: "Use a password with at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Those passwords do not match." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: authErrorMessage(error) };
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  redirect("/dashboard");
}

async function sendPasswordResetEmail(
  email: string,
  redirectTo: string
): Promise<"sent" | "unknown-user" | "fallback"> {
  if (!isResendConfigured()) return "fallback";
  const admin = createAdminClient();
  if (!admin) return "fallback";

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  if (error) {
    if (/not found/i.test(error.message)) return "unknown-user";
    logAppError({ source: "password-reset", message: error.message });
    return "fallback";
  }

  const link = data.properties?.action_link;
  if (!link) return "fallback";
  const content = passwordResetContent(link);
  const sent = await sendEmail({ to: email, ...content });
  if (!sent) {
    logAppError({ source: "password-reset", message: "Resend did not accept the reset email" });
    return "fallback";
  }
  return "sent";
}
