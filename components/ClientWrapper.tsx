"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <div className="flex">
            {!isLoginPage && <Sidebar />}
            <main className={`flex-1 min-h-screen ${!isLoginPage ? 'p-8 bg-zinc-950/30' : ''}`}>
                {children}
            </main>
        </div>
    );
}
