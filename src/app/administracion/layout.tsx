import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <AdminShell user={{ fullName: user.fullName, role: user.role }}>
      {children}
    </AdminShell>
  );
}
