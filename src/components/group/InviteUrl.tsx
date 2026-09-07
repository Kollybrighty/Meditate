import { cn } from "@/lib/utils";

type InviteUrlProps = {
  url: string;
  className?: string;
};

export default function InviteUrl({ url, className }: InviteUrlProps) {
  return (
    <a
      href={url}
      className={cn(
        "mt-4 block break-all rounded-lg bg-stone-100 p-3 font-mono text-sm text-gold hover:underline",
        className
      )}
    >
      {url}
    </a>
  );
}
