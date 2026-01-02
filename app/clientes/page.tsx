"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search,
    UserPlus,
    Filter,
    MoreHorizontal,
    CreditCard,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Hash,
    Trash2,
    RefreshCw
} from "lucide-react";
import axios from "axios";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<any[]>([]);
    const [colaHoy, setColaHoy] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const fetchData = async () => {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            const [resClientes, resCola] = await Promise.all([
                axios.get("/api/clientes"),
                axios.get(`/api/dashboard/activity?limit=100`)
            ]);

            setClientes(resClientes.data);
            // The activity API returns { items: [], pagination: {} }
            // We want to check recent messages to see if sent today.
            setColaHoy(resCola.data.items || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusForClient = (telefono: string, tipo: string) => {
        const msg = colaHoy.find(m => m.telefono === telefono && m.tipo === tipo);
        if (!msg) return { label: "No Programado", class: "bg-gray-500/10 text-gray-400 border-gray-500/10" };

        switch (msg.estado) {
            case 'enviado': return { label: "Enviado", class: "bg-green-500/20 text-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] font-bold" };
            case 'error': return { label: "Error", class: "bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] font-bold" };
            case 'pendiente': return { label: "Pendiente", class: "bg-spartan-yellow/20 text-spartan-yellow border-spartan-yellow/30 shadow-[0_0_10px_rgba(252,221,9,0.1)] animation-pulse" };
            default: return { label: msg.estado, class: "bg-white/5 text-gray-400 border-white/10" };
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este guerrero? Esta acción no se puede deshacer.")) return;

        try {
            await axios.delete(`/api/clientes/${id}`);
            setClientes(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar el cliente");
        }
    };

    const filteredClientes = useMemo(() => {
        return clientes.filter((c: any) =>
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefono.includes(searchTerm)
        );
    }, [clientes, searchTerm]);

    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
    const paginatedClientes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredClientes.slice(start, start + itemsPerPage);
    }, [filteredClientes, currentPage]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Lista de Guerreros</h1>
                    <p className="text-gray-400 mt-2">Seguimiento en tiempo real de los envíos diarios.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchData}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all border border-white/5"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <span className="bg-spartan-yellow/10 text-spartan-yellow border border-spartan-yellow/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                        Total: {filteredClientes.length}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-spartan-charcoal/30 rounded-[40px] border border-white/10 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 border-b border-white/10 bg-white/5">
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar guerrero..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                                    <th className="px-8 py-5 text-center w-20">#</th>
                                    <th className="px-6 py-5">Guerrero</th>
                                    <th className="px-6 py-5">📅 Nacimiento</th>
                                    <th className="px-6 py-5 text-center whitespace-nowrap">Estado Envío/ Cumpleaños</th>
                                    <th className="px-6 py-5 text-center whitespace-nowrap">Estado Envío/ Publicidad</th>
                                    <th className="px-8 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-8 py-10 bg-white/5"></td>
                                        </tr>
                                    ))
                                ) : paginatedClientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-sm">
                                            No hay guerreros que coincidan con la búsqueda
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedClientes.map((cliente: any) => {
                                        const hoy = new Date();
                                        hoy.setHours(0, 0, 0, 0);
                                        const [vYear, vMonth, vDay] = (cliente.fecha_vencimiento || "2000-01-01").split('-');
                                        const vencimiento = new Date(Number(vYear), Number(vMonth) - 1, Number(vDay));
                                        const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

                                        return (
                                            <tr key={cliente.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-8 py-6 text-center text-gray-600 font-mono text-xs">
                                                    {cliente.id}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-spartan-yellow/10 flex items-center justify-center text-spartan-yellow font-black border border-spartan-yellow/20 text-lg">
                                                            {cliente.nombre.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-spartan-yellow transition-colors">{cliente.nombre}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{cliente.telefono}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="text-gray-400 text-sm font-medium">
                                                        {(() => {
                                                            if (!cliente.fecha_nacimiento) return '-';
                                                            const [y, m, d] = cliente.fecha_nacimiento.split('-');
                                                            return `${d}/${m}/${y}`;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusForClient(cliente.telefono, 'cumpleaños').class}`}>
                                                        {getStatusForClient(cliente.telefono, 'cumpleaños').label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusForClient(cliente.telefono, 'publicidad').class}`}>
                                                        {getStatusForClient(cliente.telefono, 'publicidad').label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleDelete(cliente.id)}
                                                        className="text-gray-700 hover:text-red-500 p-2 transition-all hover:bg-red-500/10 rounded-xl"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/5">
                            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                                Página {currentPage} de {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="bg-white/5 border border-white/10 p-2 rounded-xl text-gray-400 hover:bg-white/10 disabled:opacity-20 transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="bg-white/5 border border-white/10 p-2 rounded-xl text-gray-400 hover:bg-white/10 disabled:opacity-20 transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
