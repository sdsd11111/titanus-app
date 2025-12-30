"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Settings,
    LogOut,
    Dumbbell,
    Terminal
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Cargar Clientes", href: "/cargar-clientes", icon: Users },
    { name: "Clientes", href: "/clientes", icon: Users }, // Keeping this as it's useful
    { name: "Conectar WhatsApp", href: "/configuracion", icon: MessageSquare },
    { name: "Logs", href: "/logs", icon: Terminal },
    { name: "Configuración", href: "/configuracion", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-screen w-64 bg-spartan-black border-r border-white/10 text-white">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-spartan-yellow p-2 rounded-lg">
                    <Dumbbell className="text-black h-6 w-6" />
                </div>
                <span className="font-bold text-xl tracking-tight">TITANUS</span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-spartan-yellow text-black font-semibold shadow-[0_0_15px_rgba(252,221,9,0.3)]"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5",
                                isActive ? "text-black" : "text-gray-400 group-hover:text-spartan-yellow"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 w-full transition-all">
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
