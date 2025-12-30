"use client";

import { useState, useEffect } from "react";
import {
    Terminal,
    Search,
    Trash2,
    Download,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";

export default function LogsPage() {
    const [logs, setLogs] = useState([
        { id: 1, type: 'success', msg: 'Mensaje de cumpleaños enviado a Abel Prueba', time: '10:30:45' },
        { id: 2, type: 'info', msg: 'Bot iniciado - Buscando vencimientos de mañana', time: '08:00:01' },
        { id: 3, type: 'error', msg: 'Error de conexión con Evolution API (reintentando...)', time: '07:55:12' },
        { id: 4, type: 'success', msg: 'Copia de seguridad de base de datos completada', time: '03:00:22' },
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">Consola de Sistema</h1>
                    <p className="text-gray-400 mt-2">Monitorea la actividad del bot en tiempo real.</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-sm font-bold">
                        <Trash2 size={16} />
                        Limpiar
                    </button>
                    <button className="bg-white/5 hover:bg-spartan-yellow/10 text-gray-400 hover:text-spartan-yellow px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-sm font-bold">
                        <Download size={16} />
                        Exportar
                    </button>
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
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Filtrar logs..."
                            className="bg-black/50 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs text-gray-400 focus:outline-none focus:border-spartan-yellow/50 w-48 transition-all"
                        />
                    </div>
                </div>

                <div className="p-6 font-mono text-sm h-[600px] overflow-y-auto space-y-3 bg-[#0a0a0a]">
                    {logs.map((log) => (
                        <div key={log.id} className="group flex gap-4 hover:bg-white/5 p-2 rounded-lg transition-colors">
                            <span className="text-gray-600 shrink-0">[{log.time}]</span>
                            <span className={
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'error' ? 'text-red-400 font-bold' :
                                        'text-blue-400'
                            }>
                                {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : 'ℹ'}
                            </span>
                            <span className="text-gray-300">{log.msg}</span>
                        </div>
                    ))}
                    <div className="flex gap-4 p-2">
                        <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                        <span className="text-spartan-yellow animate-pulse">_</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LogStat icon={<CheckCircle2 className="text-green-500" />} label="Éxitos" value="1,240" />
                <LogStat icon={<AlertCircle className="text-red-500" />} label="Errores" value="3" />
                <LogStat icon={<Clock className="text-spartan-yellow" />} label="Uptime" value="15d 4h" />
            </div>
        </div>
    );
}

function LogStat({ icon, label, value }: any) {
    return (
        <div className="bg-spartan-charcoal/30 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-white/5 p-3 rounded-xl">{icon}</div>
            <div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</div>
                <div className="text-xl font-mono text-white tracking-tight">{value}</div>
            </div>
        </div>
    );
}
