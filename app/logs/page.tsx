"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Terminal,
    Search,
    Trash2,
    Download,
    AlertCircle,
    CheckCircle2,
    Clock,
    Info
} from "lucide-react";

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/logs");
            setLogs(res.data);
        } catch (e) {
            console.error("Error logs:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Polling 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">Consola de Sistema</h1>
                    <p className="text-gray-400 mt-2">Monitorea la actividad del bot en tiempo real.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchLogs}
                        className="bg-white/5 hover:bg-spartan-yellow/10 text-gray-400 hover:text-spartan-yellow px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-sm font-bold">
                        <Terminal size={16} />
                        Actualizar
                    </button>
                    {/* Future: Add Clear/Export features */}
                </div>
            </div>

            <div className="bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="bg-spartan-charcoal p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-500/50" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                            <div className="h-3 w-3 rounded-full bg-green-500/50" />
                        </div>
                        <span className="text-xs text-gray-500 font-mono ml-4">bash — titan-bot@oracle-cloud</span>
                    </div>
                </div>

                <div className="p-6 font-mono text-sm h-[600px] overflow-y-auto space-y-3 bg-[#0a0a0a]">
                    {loading && logs.length === 0 ? (
                        <div className="text-gray-500 italic">Cargando logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-gray-500 italic">No hay logs de sistema recientes.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="group flex gap-4 hover:bg-white/5 p-2 rounded-lg transition-colors">
                                <span className="text-gray-600 shrink-0 select-none">
                                    [{new Date(log.fecha_creacion.endsWith('Z') ? log.fecha_creacion : log.fecha_creacion + 'Z').toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour12: false })}]
                                </span>
                                <span className="shrink-0">
                                    {log.estado === 'success' || log.estado === 'info' ? (
                                        <span className="text-green-400">✓</span>
                                    ) : log.estado === 'error' ? (
                                        <span className="text-red-400 font-bold">✗</span>
                                    ) : (
                                        <span className="text-blue-400">ℹ</span>
                                    )}
                                </span>
                                <span className={
                                    log.estado === 'error' ? 'text-red-300' :
                                        log.estado === 'success' ? 'text-green-300' :
                                            'text-gray-300'
                                }>{log.mensaje}</span>
                            </div>
                        ))
                    )}
                    <div className="flex gap-4 p-2">
                        <span className="text-gray-600">
                            [{new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour12: false })}]
                        </span>
                        <span className="text-spartan-yellow animate-pulse">_</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

