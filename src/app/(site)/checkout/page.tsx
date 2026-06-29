import type { Metadata } from "next";
import { CheckoutPage } from "@/components/pages/checkout-page";
import { getCurrentAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Solicitar compra",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const account = await getCurrentAccount();
  let defaultEmail: string | null = account?.email ?? null;

  if (account) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    defaultEmail = user?.email ?? defaultEmail;
  }

  return <CheckoutPage isAuthed={Boolean(account)} defaultEmail={defaultEmail} />;
}
