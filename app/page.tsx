import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/report");
  if (session.role === "ADMIN") redirect("/admin/dashboard");
  redirect("/company/dashboard");
}
