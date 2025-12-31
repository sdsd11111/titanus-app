"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Brain,
    Save,
    Smartphone,
    CheckCircle,
    XCircle,
    RefreshCw,
    Zap,
    Eye,
    ChevronDown,
    Send,
    LogOut
} from "lucide-react";
import axios from "axios";

export default function ConfigPage() {
    const [configs, setConfigs] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        fetchConfigs();
        checkWhatsAppStatus();

        // Poll status every 5 seconds for real-time updates
        const interval = setInterval(() => {
            checkWhatsAppStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchConfigs = async () => {
        try {
            const response = await axios.get("/api/config");
            setConfigs(response.data);
        } catch (error) {
            console.error("Error fetching configs:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkWhatsAppStatus = async () => {
        try {
            const response = await axios.get("/api/whatsapp/status");
            setWsStatus(response.data.connected ? 'connected' : 'disconnected');
        } catch (error) {
            setWsStatus('disconnected');
        }
    };

    const saveConfig = async (clave: string, valor: string) => {
        setSaving(true);
        try {
            await axios.post("/api/config", { clave, valor });
            await fetchConfigs();
        } finally {
            setSaving(false);
        }
    };

    const sendTestMessage = async () => {
        if (!testPhone || !testMessage) {
            setTestResult({ success: false, message: 'Por favor completa todos los campos' });
            return;
        }

        setSendingTest(true);
        setTestResult(null);

        try {
            const response = await axios.post("/api/whatsapp/test", {
                phoneNumber: testPhone,
                message: testMessage
            });

            setTestResult({
                success: true,
                message: '✅ Mensaje enviado correctamente!'
            });

            // Clear form after successful send
            setTimeout(() => {
                setTestPhone('');
                setTestMessage('');
                setTestResult(null);
            }, 3000);
        } catch (error: any) {
            setTestResult({
                success: false,
                message: `❌ Error: ${error.response?.data?.error || 'No se pudo enviar el mensaje'}`
            });
        } finally {
            setSendingTest(false);
        }
    };

    const getQrCode = async () => {
        setLoadingQr(true);
        setQrCode(null);

        try {
            await axios.post("/api/whatsapp/qr");
            // Set the QR image URL with timestamp to avoid caching
            setQrCode(`/api/whatsapp/qr?t=${Date.now()}`);
        } catch (error) {
            console.error('Error fetching QR:', error);
            alert('Error al obtener el código QR');
        } finally {
            setLoadingQr(false);
        }
    };

    const disconnectWhatsApp = async () => {
        if (!confirm('¿Estás seguro de que quieres desconectar el WhatsApp? El bot dejará de funcionar.')) return;

        setDisconnecting(true);
        try {
            await axios.post("/api/whatsapp/logout");
            alert('Desconectado correctamente');
            // Force status refresh
            checkWhatsAppStatus();
            setQrCode(null);
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Error al desconectar. Intenta de nuevo.');
        } finally {
            setDisconnecting(false);
        }
    };

    const providers = [
        { id: "openai", name: "OpenAI (GPT-4o/3.5)", icon: "✨" },
        { id: "gemini", name: "Google Gemini", icon: "💎" },
        { id: "ollama", name: "Ollama (Local/Gratis)", icon: "🏠" },
    ];

    if (loading) return <div className="p-8 text-gray-500 animate-pulse">Cargando configuración...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Ajustes del Sistema</h1>
                    <p className="text-gray-400 mt-2">Configura las llaves maestras y parámetros operativos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* IA Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-spartan-yellow">
                        <Brain size={24} />
                        <h2>Cerebro IA (Prompts)</h2>
                    </div>

                    <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-6 space-y-4">
                        <label className="text-sm text-gray-400 font-bold uppercase tracking-wider">Proveedor de IA Activo</label>
                        <div className="grid grid-cols-1 gap-3">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => saveConfig('ai_provider', p.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${configs.ai_provider === p.id
                                        ? 'border-spartan-yellow bg-spartan-yellow/10 text-white'
                                        : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{p.icon}</span>
                                        <span className="font-semibold">{p.name}</span>
                                    </div>
                                    {configs.ai_provider === p.id && <CheckCircle className="text-spartan-yellow h-5 w-5" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <PromptCard
                        title="Mensaje de Cumpleaños"
                        description="Personaliza cómo la IA redactará las felicitaciones."
                        value={configs.prompt_cumpleanios || ""}
                        variables={["Nombre"]}
                        onSave={(val: string) => saveConfig('prompt_cumpleanios', val)}
                        saving={saving}
                    />

                    <PromptCard
                        title="Recordatorio de Vencimiento"
                        description="Prompt para avisar que la membresía está por terminar."
                        value={configs.prompt_vencimiento || ""}
                        variables={["Nombre", "FechaVencimiento"]}
                        onSave={(val: string) => saveConfig('prompt_vencimiento', val)}
                        saving={saving}
                    />

                    <PromptCard
                        title="Seguimiento de Inasistencia"
                        description="Prompt para motivar al cliente a volver al gym."
                        value={configs.prompt_seguimiento || ""}
                        variables={["Nombre", "DíasInactividad"]}
                        onSave={(val: string) => saveConfig('prompt_seguimiento', val)}
                        saving={saving}
                    />
                </div>

                {/* WhatsApp & Keys Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-spartan-yellow">
                        <Smartphone size={24} />
                        <h2>Conexión y Llaves</h2>
                    </div>

                    {/* API Keys Card */}
                    <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-8 space-y-6">
                        <h3 className="font-bold text-lg">Configuración de API Keys</h3>

                        <div className="space-y-4">
                            <KeyInput
                                label="OpenAI API Key"
                                placeholder="sk-..."
                                value={configs.openai_api_key || ""}
                                onSave={(val: string) => saveConfig('openai_api_key', val)}
                            />
                            <KeyInput
                                label="Gemini API Key"
                                placeholder="AIza..."
                                value={configs.gemini_api_key || ""}
                                onSave={(val: string) => saveConfig('gemini_api_key', val)}
                            />
                            <KeyInput
                                label="Ollama URL (Local)"
                                placeholder="http://localhost:11434"
                                value={configs.ollama_url || "http://localhost:11434"}
                                onSave={(val: string) => saveConfig('ollama_url', val)}
                            />
                        </div>
                    </div>

                    {/* WhatsApp Status Card */}
                    <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${wsStatus === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <div className="font-bold">WhatsApp Instance</div>
                                    <div className="text-sm text-gray-500">gym_bot v2.3.7</div>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${wsStatus === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {wsStatus === 'connected' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {wsStatus === 'connected' ? 'Activo' : 'Offline'}
                            </div>
                        </div>

                        {wsStatus === 'disconnected' && (
                            <div className="space-y-4">
                                {!qrCode ? (
                                    <button
                                        onClick={getQrCode}
                                        disabled={loadingQr}
                                        className="w-full spartan-gradient text-black p-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Smartphone size={20} />
                                        {loadingQr ? 'Generando QR...' : 'Conectar WhatsApp'}
                                    </button>
                                ) : (
                                    <div className="bg-white p-6 rounded-3xl space-y-4 animate-in zoom-in-95 duration-300">
                                        <div className="text-center space-y-2">
                                            <h4 className="font-bold text-black text-lg">Escanea este código QR</h4>
                                            <p className="text-sm text-gray-600">Abre WhatsApp en tu teléfono y escanea este código</p>
                                        </div>
                                        <div className="flex justify-center">
                                            <img
                                                src={qrCode}
                                                alt="WhatsApp QR Code"
                                                className="w-64 h-64 border-4 border-spartan-yellow rounded-2xl"
                                            />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-xs text-gray-500">
                                                1. Abre WhatsApp en tu teléfono<br />
                                                2. Toca Menú o Configuración<br />
                                                3. Toca Dispositivos vinculados<br />
                                                4. Escanea este código QR
                                            </p>
                                            <button
                                                onClick={() => setQrCode(null)}
                                                className="text-xs text-gray-500 hover:text-black underline"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {wsStatus === 'connected' && (
                            <div className="space-y-3">
                                <button
                                    onClick={checkWhatsAppStatus}
                                    className="w-full bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="h-5 w-5 text-gray-500 group-hover:rotate-180 transition-all duration-500" />
                                        <span className="text-gray-300 font-medium">Actualizar Estado</span>
                                    </div>
                                    <Zap className="h-4 w-4 text-spartan-yellow" />
                                </button>

                                <button
                                    onClick={disconnectWhatsApp}
                                    disabled={disconnecting}
                                    className="w-full bg-red-500/10 p-4 rounded-2xl flex items-center justify-between border border-red-500/20 hover:bg-red-500/20 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <LogOut className="h-5 w-5 text-red-500" />
                                        <span className="text-red-400 font-medium">Desconectar</span>
                                    </div>
                                    {disconnecting && <span className="text-xs text-red-400">Procesando...</span>}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Test Message Card */}
                    <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-8 space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Send size={20} className="text-spartan-yellow" />
                            Prueba de Mensaje
                        </h3>
                        <p className="text-sm text-gray-500">
                            Envía un mensaje de prueba para verificar que la conexión funciona correctamente.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    Número de WhatsApp
                                </label>
                                <input
                                    type="text"
                                    placeholder="593963410409"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all"
                                    disabled={sendingTest}
                                />
                                <p className="text-[10px] text-gray-600">
                                    Incluye código de país sin el signo +
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    Mensaje
                                </label>
                                <textarea
                                    placeholder="Escribe tu mensaje de prueba aquí..."
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all min-h-[100px]"
                                    disabled={sendingTest}
                                />
                            </div>

                            {testResult && (
                                <div className={`p-4 rounded-2xl border ${testResult.success
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    } animate-in slide-in-from-top-2 duration-300`}>
                                    {testResult.message}
                                </div>
                            )}

                            <button
                                onClick={sendTestMessage}
                                disabled={sendingTest || wsStatus !== 'connected'}
                                className="w-full spartan-gradient text-black py-3 px-6 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <Send size={16} />
                                {sendingTest ? 'Enviando...' : 'Enviar Prueba'}
                            </button>

                            {wsStatus !== 'connected' && (
                                <p className="text-xs text-red-400 text-center">
                                    ⚠️ El WhatsApp debe estar conectado para enviar mensajes
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KeyInput({ label, placeholder, value, onSave }: any) {
    const [localVal, setLocalVal] = useState(value);
    useEffect(() => setLocalVal(value), [value]);

    return (
        <div className="space-y-2">
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type="password"
                    placeholder={placeholder}
                    value={localVal}
                    onChange={(e) => setLocalVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all font-mono text-sm"
                />
                <button
                    onClick={() => onSave(localVal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-spartan-yellow font-bold text-xs uppercase hover:bg-spartan-yellow/10 px-3 py-1.5 rounded-xl transition-all"
                >
                    Listo
                </button>
            </div>
        </div>
    );
}

function PromptCard({ title, description, value, variables, onSave, saving }: any) {
    const [localVal, setLocalVal] = useState(value);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    const getPreviewText = () => {
        let text = localVal || "Escribe un prompt para ver la preview...";
        const demoVars: any = {
            "Nombre": "Leonidas espartano",
            "FechaVencimiento": "2025-01-15",
            "DíasInactividad": "7"
        };

        return (
            <div className="space-y-4">
                <div className="text-xs text-spartan-yellow font-mono bg-black/40 p-3 rounded-xl border border-spartan-yellow/20">
                    SISTEMA: Usando variables de prueba...
                </div>
                <div className="bg-spartan-black p-4 rounded-2xl border border-white/10 text-gray-300 text-sm italic leading-relaxed">
                    "Hola {demoVars.Nombre}! {title.includes('Cumpleaños') ? 'Feliz cumple!' : title.includes('Vencimiento') ? `Tu membresía vence el ${demoVars.FechaVencimiento}.` : `Te extrañamos, llevas ${demoVars.DíasInactividad} días sin venir.`} No te rindas, ¡te esperamos en Titanus Fitness! 💪"
                </div>
                <p className="text-[10px] text-gray-600">Nota: La IA redactará el mensaje final basándose en tu prompt y la personalidad del gimnasio.</p>
            </div>
        );
    };

    return (
        <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-6 space-y-4 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg group-hover:text-spartan-yellow transition-colors">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                    {variables.map((v: string) => (
                        <span key={v} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400 font-mono">
                            {"{{"}{v}{"}}"}
                        </span>
                    ))}
                </div>
            </div>

            <textarea
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all min-h-[120px]"
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                placeholder="Ej: Redacta un mensaje motivador de cumpleaños estilo espartano..."
            />

            {showPreview && (
                <div className="animate-in zoom-in-95 duration-200">
                    {getPreviewText()}
                </div>
            )}

            <div className="flex justify-between items-center gap-4">
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-gray-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-all"
                >
                    <Eye size={14} />
                    {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
                </button>
                <button
                    onClick={() => onSave(localVal)}
                    disabled={saving}
                    className="spartan-gradient text-black py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
                >
                    <Save size={14} />
                    {saving ? 'Guardando...' : 'Actualizar Prompt'}
                </button>
            </div>
        </div>
    );
}
