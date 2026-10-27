// src/app/farmer/layout.tsx
import { FarmerAppProvider } from "@/context/FarmerAppContext";
import { FarmerHeader } from "@/components/FarmerHeader";
import { Sidebar } from "@/components/Sidebar";

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FarmerAppProvider>
        <FarmerHeader />
        <div className="flex">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    </FarmerAppProvider>
  );
}
