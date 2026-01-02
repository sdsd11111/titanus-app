"use client";

import { useState } from "react";
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Info
} from "lucide-react";
import * as XLSX from 'xlsx';
import axios from 'axios';

export default function CargarClientesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [results, setResults] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            const reader = new FileReader();

            reader.onload = async (event) => {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Send to API
                const response = await axios.post('/api/clientes/batch', jsonData);
                setResults(response.data);
                setStatus('success');
                setUploading(false);
            };

            reader.onerror = () => {
                setStatus('error');
                setUploading(false);
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('error');
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Cargar Clientes</h1>
                <p className="text-gray-400 mt-2">Importa tu base de datos de guerreros de forma masiva.</p>
            </div>

            <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Step icon={<FileText />} text="Prepara tu CSV o Excel" active={!!file} />
                    <Step icon={<Upload />} text="Sube el archivo" active={uploading} />
                    <Step icon={<CheckCircle2 />} text="Verifica y Confirma" active={status === 'success'} />
                </div>

                <div
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${file ? 'border-spartan-yellow bg-spartan-yellow/5' : 'border-white/10 hover:border-white/20'
                        }`}
                >
                    {status === 'success' ? (
                        <div className="space-y-4">
                            <div className="bg-green-500/10 text-green-500 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold italic">¡GUERREROS CARGADOS!</h3>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 max-w-md mx-auto">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-white font-bold text-2xl">{results?.stats?.total || 0}</div>
                                        <div className="text-gray-500 text-xs uppercase">En Archivo</div>
                                    </div>
                                    <div>
                                        <div className="text-green-400 font-bold text-2xl">{results?.stats?.inserted_or_updated || 0}</div>
                                        <div className="text-gray-500 text-xs uppercase">Procesados</div>
                                    </div>
                                    <div>
                                        <div className="text-red-400 font-bold text-2xl">{results?.stats?.errors || 0}</div>
                                        <div className="text-gray-500 text-xs uppercase">Errores</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setStatus('idle'); setResults(null); }}
                                className="text-spartan-yellow font-bold underline"
                            >
                                Cargar otro archivo
                            </button>
                        </div>
                    ) : status === 'error' ? (
                        <div className="space-y-4">
                            <div className="bg-red-500/10 text-red-500 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold">Error en la carga</h3>
                            <p className="text-gray-400">Verifica que el archivo tenga el formato correcto.</p>
                            <button
                                onClick={() => { setFile(null); setStatus('idle'); }}
                                className="text-spartan-yellow font-bold underline"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white/5 h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="text-gray-500 h-10 w-10" />
                            </div>
                            <div>
                                <label className="cursor-pointer">
                                    <span className="spartan-gradient text-black font-bold px-6 py-3 rounded-xl inline-block hover:opacity-90 transition-all">
                                        Seleccionar Archivo
                                    </span>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx,.xls" />
                                </label>
                                <p className="text-gray-500 mt-4 text-sm">O arrastra y suelta tu archivo aquí (máx 10MB)</p>
                            </div>
                            {file && (
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between text-left max-w-sm mx-auto">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-spartan-yellow" />
                                        <span className="text-sm font-medium truncate">{file.name}</span>
                                    </div>
                                    <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <AlertCircle size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {file && status === 'idle' && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-white text-black font-extrabold px-12 py-4 rounded-2xl flex items-center gap-2 hover:bg-spartan-yellow transition-all disabled:opacity-50"
                        >
                            {uploading ? 'PROCESANDO...' : 'EMPEZAR IMPORTACIÓN'}
                            {!uploading && <ArrowRight size={20} />}
                        </button>
                    </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex gap-4">
                    <Info className="text-blue-500 shrink-0" />
                    <div className="text-sm text-blue-200/80 leading-relaxed">
                        <span className="font-bold text-blue-400 block mb-1">Formato Requerido:</span>
                        Tu archivo debe tener las columnas: <code className="text-white bg-black/50 px-1 rounded">nombre</code>, <code className="text-white bg-black/50 px-1 rounded">telefono</code> (con código de país), <code className="text-white bg-black/50 px-1 rounded">fecha_vencimiento</code> y <code className="text-white bg-black/50 px-1 rounded">fecha_nacimiento</code> (formato: YYYY-MM-DD).
                    </div>
                </div>
            </div>
        </div>
    );
}

function Step({ icon, text, active }: any) {
    return (
        <div className={`flex flex-col items-center gap-3 text-center ${active ? 'text-spartan-yellow' : 'text-gray-600'}`}>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center border-2 transition-all ${active ? 'border-spartan-yellow bg-spartan-yellow/10' : 'border-white/10 bg-white/5'
                }`}>
                {icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">{text}</span>
        </div>
    );
}
