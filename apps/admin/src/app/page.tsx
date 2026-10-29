import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  redirect(homeForRole(session.user.role));
}
