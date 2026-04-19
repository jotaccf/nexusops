import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "../../lib/auth";
import { SessionProvider } from "../../lib/SessionContext";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const user = await verifyToken(token);
  if (!user) {
    redirect("/login");
  }

  return (
    <SessionProvider user={user}>
      {children}
    </SessionProvider>
  );
}
