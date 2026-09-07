import KidsNav from "@/components/kids/KidsNav";

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KidsNav />
      {children}
    </>
  );
}
