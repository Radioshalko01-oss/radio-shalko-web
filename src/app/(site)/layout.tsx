import { Footer } from "@/components/site/footer";
import { HashScroll } from "@/components/site/hash-scroll";
import { SiteHeader } from "@/components/site/header";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <HashScroll />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
