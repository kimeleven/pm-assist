import CompanySidebar from "@/components/layout/CompanySidebar";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <CompanySidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
