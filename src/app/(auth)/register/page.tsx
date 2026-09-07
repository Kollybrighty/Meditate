import RegisterForm from "../RegisterForm";
import { safeNextPath } from "@/lib/safe-path";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <RegisterForm nextPath={safeNextPath(next)} />;
}
