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
    Trash2
} from "lucide-react";
import axios from "axios";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const fetchClientes = async () => {
        try {
            const response = await axios.get("/api/clientes");
            setClientes(response.data);
        } catch (error) {
            console.error("Error fetching clientes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientes();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este guerrero? Esta acción no se puede deshacer.")) return;

        try {
            await axios.delete(`/api/clientes/${id}`);
            // Actualizar estado local
            setClientes(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar el cliente");
        }
    };


    // Filtro de búsqueda (Autocomplete simulado)
    const filteredClientes = useMemo(() => {
        return clientes.filter((c: any) =>
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.telefono.includes(searchTerm)
        );
    }, [clientes, searchTerm]);

    // Lógica de Paginación
    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
    const paginatedClientes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredClientes.slice(start, start + itemsPerPage);
    }, [filteredClientes, currentPage]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Gestión de Clientes</h1>
                    <p className="text-gray-400 mt-2">Administra la hermandad de Titanus Fitness.</p>
                </div>
                <button className="spartan-gradient text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(252,221,9,0.2)]">
                    <UserPlus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o teléfono..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset a primera página al buscar
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <span className="bg-spartan-yellow/10 text-spartan-yellow border border-spartan-yellow/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                <Hash size={16} /> {filteredClientes.length} Clientes
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-400 text-sm uppercase tracking-wider border-b border-white/10 bg-white/5">
                                    <th className="px-6 py-4 font-semibold text-center w-16">ID</th>
                                    <th className="px-6 py-4 font-semibold">Cliente</th>
                                    <th className="px-6 py-4 font-semibold">Nacimiento</th>
                                    <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                    <th className="px-6 py-4 font-semibold">Membresía & Seguimiento</th>
                                    <th className="px-6 py-4 font-semibold">Deuda</th>
                                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-8 h-16 bg-white/5"></td>
                                        </tr>
                                    ))
                                ) : paginatedClientes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                            No se encontraron guerreros en la base de datos.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedClientes.map((cliente: any) => {
                                        const hoy = new Date();
                                        hoy.setHours(0, 0, 0, 0);

                                        // Manually parse YYYY-MM-DD to get local midnight date
                                        const [vYear, vMonth, vDay] = (cliente.fecha_vencimiento || "2000-01-01").split('-');
                                        const vencimiento = new Date(Number(vYear), Number(vMonth) - 1, Number(vDay));

                                        const diffTime = vencimiento.getTime() - hoy.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                        let statusMsg = "";
                                        let statusClass = "text-gray-400";

                                        if (diffDays === 1) {
                                            statusMsg = "Vence mañana (Recordatorio)";
                                            statusClass = "text-spartan-yellow shadow-[0_0_10px_rgba(252,221,9,0.1)]";
                                        } else if (diffDays === 0) {
                                            statusMsg = "Vence hoy";
                                            statusClass = "text-red-400";
                                        } else if (diffDays === -7) {
                                            statusMsg = "Seguimiento (1 sem vencido)";
                                            statusClass = "text-orange-400 font-bold";
                                        } else if (diffDays < 0) {
                                            statusMsg = `Vencido hace ${Math.abs(diffDays)} días`;
                                            statusClass = "text-gray-600";
                                        } else {
                                            statusMsg = `Vence en ${diffDays} días`;
                                        }

                                        return (
                                            <tr key={cliente.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5 text-center text-gray-500 font-mono text-sm">
                                                    #{cliente.id}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-spartan-yellow/10 flex items-center justify-center text-spartan-yellow font-bold border border-spartan-yellow/20">
                                                            {cliente.nombre.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white group-hover:text-spartan-yellow transition-colors">{cliente.nombre}</div>
                                                            <div className="text-sm text-gray-500">{cliente.telefono}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                        <Calendar className="h-4 w-4 opacity-50" />
                                                        {(() => {
                                                            if (!cliente.fecha_nacimiento) return 'N/A';
                                                            // Split YYYY-MM-DD to avoid timezone issues
                                                            const [year, month, day] = cliente.fecha_nacimiento.split('-');
                                                            return `${day}/${month}/${year}`;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${cliente.estado === 'activo'
                                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                        }`}>
                                                        {cliente.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-gray-300 font-medium">
                                                            <Calendar className="h-4 w-4 text-gray-500" />
                                                            {`${vDay}/${vMonth}/${vYear}`}
                                                        </div>
                                                        <div className={`text-xs uppercase tracking-tighter ${statusClass}`}>
                                                            {statusMsg}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`flex items-center gap-1 font-mono ${cliente.deuda > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        <CreditCard className="h-4 w-4" />
                                                        ${Number(cliente.deuda).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleDelete(cliente.id)}
                                                            className="text-gray-500 hover:text-red-500 p-2 transition-colors hover:bg-red-500/10 rounded-lg group-hover/btn:opacity-100"
                                                            title="Eliminar Guerrero"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button className="text-gray-500 hover:text-white p-2 transition-colors rounded-lg hover:bg-white/5">
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </div>
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
                        <div className="p-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-gray-500 text-sm">
                                Mostrando <span className="text-gray-300">{paginatedClientes.length}</span> de <span className="text-gray-300">{filteredClientes.length}</span> guerreros
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="bg-white/5 border border-white/10 p-2 rounded-xl text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center px-4 text-sm font-bold text-spartan-yellow">
                                    Página {currentPage} de {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="bg-white/5 border border-white/10 p-2 rounded-xl text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
