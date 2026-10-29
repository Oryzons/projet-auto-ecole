import { Suspense } from "react";

import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata = { title: "Nouveau mot de passe" };

export default function Page() {
  return (
    <Suspense>
      <SetPasswordForm mode="reset" />
    </Suspense>
  );
}
