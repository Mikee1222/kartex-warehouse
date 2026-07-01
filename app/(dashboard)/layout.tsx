import { WarehouseShell } from "@/components/layout/warehouse-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WarehouseShell>{children}</WarehouseShell>;
}
