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
    const [tempHora, setTempHora] = useState("");

    useEffect(() => {
        fetchConfigs();
        checkWhatsAppStatus();

        // Poll status every 5 seconds for real-time updates
        const interval = setInterval(() => {
            checkWhatsAppStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (configs.envio_hora && !tempHora) {
            setTempHora(configs.envio_hora);
        }
    }, [configs.envio_hora]);

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

                    <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-6 space-y-6">
                        <div className="space-y-4">
                            <label className="text-sm text-gray-400 font-bold uppercase tracking-wider block">Proveedor de IA Activo</label>
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
                                            <div>
                                                <div className="font-semibold">{p.name}</div>
                                                {p.id === 'gemini' && (
                                                    <div className="text-[10px] text-spartan-yellow font-bold uppercase tracking-wider">
                                                        Universal Adapter Active
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {configs.ai_provider === p.id && <CheckCircle className="text-spartan-yellow h-5 w-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="space-y-4">
                                <KeyInput
                                    label={configs.ai_provider === 'openai' ? "OpenAI API Key" : "Gemini API Key"}
                                    placeholder={configs.ai_provider === 'openai' ? "sk-..." : "AIza..."}
                                    value={configs.ai_provider === 'openai' ? (configs.openai_api_key || "") : (configs.gemini_api_key || "")}
                                    onSave={(val: string) => saveConfig(configs.ai_provider === 'openai' ? 'openai_api_key' : 'gemini_api_key', val)}
                                />
                                {configs.ai_provider === 'openai' && (
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Modelo de Inteligencia</label>
                                        <select
                                            value={configs.openai_model || 'gpt-3.5-turbo'}
                                            onChange={(e) => saveConfig('openai_model', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all font-bold appearance-none cursor-pointer"
                                        >
                                            <option value="gpt-3.5-turbo" className="bg-spartan-charcoal">GPT-3.5 Turbo (Económico/Estándar)</option>
                                            <option value="gpt-4o-mini" className="bg-spartan-charcoal">GPT-4o Mini (Rápido/Eficiente)</option>
                                            <option value="gpt-4o" className="bg-spartan-charcoal">GPT-4o (Máxima Potencia)</option>
                                            <option value="gpt-4-turbo" className="bg-spartan-charcoal">GPT-4 Turbo</option>
                                        </select>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2">
                                            Asegúrate de que tu cuenta de OpenAI tenga acceso al modelo seleccionado.
                                        </p>
                                    </div>
                                )}
                                {configs.ai_provider === 'gemini' && (
                                    <div className="bg-blue-500/10 p-4 rounded-xl text-xs text-blue-300 border border-blue-500/20">
                                        ℹ️ <b>Tip:</b> Activa tu llave en Google AI Studio. Es gratis y el bot se adaptará automáticamente a tu modelo.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <PromptCard
                        title="Mensaje de Cumpleaños"
                        description="Personaliza cómo la IA redactará las felicitaciones."
                        tipo="cumpleanios"
                        promptValue={configs.prompt_cumpleanios || ""}
                        staticValue={configs.prompt_cumpleanios_static || ""}
                        mode={configs.prompt_cumpleanios_mode || 'ai'}
                        variables={["Nombre"]}
                        onSave={saveConfig}
                        onModeChange={(mode: string) => saveConfig('prompt_cumpleanios_mode', mode)}
                        saving={saving}
                        provider={configs.ai_provider || 'openai'}
                        apiKeys={{
                            openai: configs.openai_api_key,
                            gemini: configs.gemini_api_key
                        }}
                    />

                    <PromptCard
                        title="Recordatorio de Vencimiento"
                        description="Prompt para avisar que la membresía está por terminar."
                        tipo="vencimiento"
                        promptValue={configs.prompt_vencimiento || ""}
                        staticValue={configs.prompt_vencimiento_static || ""}
                        mode={configs.prompt_vencimiento_mode || 'ai'}
                        variables={["Nombre", "FechaVencimiento"]}
                        onSave={saveConfig}
                        onModeChange={(mode: string) => saveConfig('prompt_vencimiento_mode', mode)}
                        saving={saving}
                        provider={configs.ai_provider || 'openai'}
                        apiKeys={{
                            openai: configs.openai_api_key,
                            gemini: configs.gemini_api_key
                        }}
                    />

                    <PromptCard
                        title="Seguimiento de Inasistencia"
                        description="Prompt para motivar al cliente a volver al gym."
                        tipo="seguimiento"
                        promptValue={configs.prompt_seguimiento || ""}
                        staticValue={configs.prompt_seguimiento_static || ""}
                        mode={configs.prompt_seguimiento_mode || 'ai'}
                        variables={["Nombre", "DíasInactividad"]}
                        onSave={saveConfig}
                        onModeChange={(mode: string) => saveConfig('prompt_seguimiento_mode', mode)}
                        saving={saving}
                        provider={configs.ai_provider || 'openai'}
                        apiKeys={{
                            openai: configs.openai_api_key,
                            gemini: configs.gemini_api_key
                        }}
                    />
                </div>

                {/* WhatsApp Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold text-spartan-yellow">
                        <Smartphone size={24} />
                        <h2>Conexión y Horarios</h2>
                    </div>

                    {/* Scheduler Card */}
                    <div className="bg-spartan-charcoal/30 rounded-3xl border border-white/10 p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-spartan-yellow/10 flex items-center justify-center text-spartan-yellow">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Horario de Automatización</h3>
                                <p className="text-xs text-gray-500 text-balance">El bot despertará a esta hora cada día para procesar la lista.</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4 mb-2 block">Hora de Envío (Formato 24h)</label>
                                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="time"
                                            value={tempHora || configs.envio_hora || "08:00"}
                                            onChange={(e) => setTempHora(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-3xl font-black text-white focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all text-center appearance-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                            <RefreshCw size={24} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => saveConfig('envio_hora', tempHora)}
                                        className="spartan-gradient text-black font-black px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-tighter"
                                    >
                                        <CheckCircle size={18} />
                                        Guardar
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-600 text-center font-bold px-4">
                                ℹ️ Configura esto según tu preferencia. Ejemplo: 08:00 para la mañana o 19:00 para la noche.
                            </p>
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
    const isConfigured = value === "******** (Configurado)";
    const [localVal, setLocalVal] = useState(value);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    return (
        <div className="space-y-2">
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type={isEditing || !isConfigured ? "text" : "password"}
                    placeholder={placeholder}
                    value={localVal}
                    onFocus={() => {
                        if (isConfigured) {
                            setLocalVal("");
                            setIsEditing(true);
                        }
                    }}
                    onChange={(e) => setLocalVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all font-mono text-sm"
                />
                <button
                    onClick={() => {
                        onSave(localVal);
                        setIsEditing(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-spartan-yellow font-bold text-xs uppercase hover:bg-spartan-yellow/10 px-3 py-1.5 rounded-xl transition-all"
                >
                    {isConfigured && !isEditing ? "Cambiar" : "Listo"}
                </button>
            </div>
        </div>
    );
}

function PromptCard({ title, description, tipo, promptValue, staticValue, mode, variables, onSave, onModeChange, saving, provider, apiKeys }: any) {
    const [localPrompt, setLocalPrompt] = useState(promptValue);
    const [localStatic, setLocalStatic] = useState(staticValue);
    const [showPreview, setShowPreview] = useState(false);
    const [previewText, setPreviewText] = useState("");
    const [generating, setGenerating] = useState(false);
    const [isManual, setIsManual] = useState(mode === 'static');
    const [editMode, setEditMode] = useState<'prompt' | 'static'>(mode === 'static' ? 'static' : 'prompt');
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    useEffect(() => {
        setLocalPrompt(promptValue);
        setLocalStatic(staticValue);
    }, [promptValue, staticValue]);

    useEffect(() => {
        setIsManual(mode === 'static');
        setEditMode(mode === 'static' ? 'static' : 'prompt');
    }, [mode]);

    const handlePreview = async () => {
        if (!showPreview) {
            setShowPreview(true);
            if (!previewText) await generateText();
        } else {
            setShowPreview(false);
        }
    };

    const generateText = async () => {
        setGenerating(true);
        setPreviewText("");

        try {
            const demoVars: any = {
                "Nombre": "Leonidas",
                "FechaVencimiento": "mañana",
                "DíasInactividad": "7"
            };

            const response = await axios.post('/api/ai/preview', {
                provider,
                apiKey: provider === 'openai' ? apiKeys.openai : apiKeys.gemini,
                prompt: localPrompt,
                variables: demoVars
            });

            setPreviewText(response.data.result);
        } catch (error: any) {
            setPreviewText(`Error al generar preview: ${error.message || 'Error desconocido'}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async (forceStatic?: string) => {
        const key = forceStatic ? `prompt_${tipo}_static` : (editMode === 'prompt' ? `prompt_${tipo}` : `prompt_${tipo}_static`);
        const val = forceStatic || (editMode === 'prompt' ? localPrompt : localStatic);

        setSaveStatus("Guardando...");
        await onSave(key, val);
        setSaveStatus("¡Guardado!");
        setTimeout(() => setSaveStatus(null), 2000);
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

            {/* Mode Switcher */}
            <div className="flex items-center justify-between p-1 bg-black/40 rounded-2xl border border-white/5">
                <button
                    onClick={() => onModeChange('ai')}
                    className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!isManual ? 'bg-spartan-yellow text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    Modo IA (Dinámico)
                </button>
                <button
                    onClick={() => onModeChange('static')}
                    className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isManual ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'text-gray-500 hover:text-white'}`}
                >
                    Modo Plantilla (Fijo)
                </button>
            </div>

            {/* Tabs for Editing */}
            <div className="flex gap-2 mb-2">
                <button
                    onClick={() => setEditMode('prompt')}
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${editMode === 'prompt' ? 'border-spartan-yellow text-spartan-yellow bg-spartan-yellow/5' : 'border-white/5 text-gray-500'}`}
                >
                    ⚙️ Instrucciones IA
                </button>
                <button
                    onClick={() => setEditMode('static')}
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${editMode === 'static' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-white/5 text-gray-500'}`}
                >
                    📝 Mensaje Fijo
                </button>
            </div>

            {editMode === 'prompt' ? (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-200">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Prompt / Instrucciones para el Coach</label>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-spartan-yellow/50 transition-all min-h-[120px]"
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        placeholder="Define la personalidad del Coach..."
                    />
                </div>
            ) : (
                <div className="space-y-2 animate-in slide-in-from-right-2 duration-200">
                    <label className="text-[10px] text-orange-500/70 font-bold uppercase">Mensaje Fijo que se enviará a todos</label>
                    <textarea
                        className="w-full bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 text-sm text-orange-100/90 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all min-h-[120px]"
                        value={localStatic}
                        onChange={(e) => setLocalStatic(e.target.value)}
                        placeholder="Escribe el mensaje exacto..."
                    />
                    <p className="text-[10px] text-orange-500/50 italic">
                        * En este modo el mensaje es fijo (no IA). Se enviará tal cual cambiando {"{{Nombre}}"}.
                    </p>
                </div>
            )}

            {showPreview && (
                <div className="animate-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-spartan-yellow/20">
                            <span className="text-xs text-spartan-yellow font-mono">
                                🤖 Borrador de la IA (Editable)
                            </span>
                            <button
                                onClick={generateText}
                                disabled={generating}
                                className="text-[10px] font-bold uppercase text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                <RefreshCw size={12} className={generating ? "animate-spin" : ""} /> Generar de nuevo
                            </button>
                        </div>
                        <div className="space-y-3">
                            <textarea
                                className="w-full bg-black/60 p-4 rounded-2xl border border-white/10 text-gray-300 text-sm italic leading-relaxed min-h-[120px] focus:outline-none focus:ring-1 focus:ring-white/20"
                                value={previewText}
                                onChange={(e) => setPreviewText(e.target.value)}
                                placeholder={generating ? "Coach pensando..." : "El mensaje de la IA aparecerá aquí..."}
                            />
                            {previewText && !generating && (
                                <button
                                    onClick={() => {
                                        setLocalStatic(previewText);
                                        setEditMode('static');
                                        onModeChange('static');
                                        handleSave(previewText);
                                    }}
                                    className="w-full bg-orange-500/10 text-orange-500 border border-orange-500/30 py-3 rounded-xl text-[10px] font-bold uppercase hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={14} />
                                    Fijar este mensaje para todos (Activa Plantilla)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center gap-4">
                <button
                    onClick={handlePreview}
                    className="text-gray-500 hover:text-white flex items-center gap-2 text-xs font-bold uppercase transition-all"
                >
                    <Eye size={14} />
                    {showPreview ? 'Ocultar Borrador' : 'Ver Borrador IA'}
                </button>
                <div className="flex items-center gap-3">
                    {saveStatus && <span className="text-xs text-spartan-yellow font-bold animate-pulse">{saveStatus}</span>}
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className={`py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 ${editMode === 'prompt' ? 'spartan-gradient text-black bg-spartan-yellow' : 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'}`}
                    >
                        <Save size={14} />
                        {saving ? 'Guardando...' : `Guardar ${editMode === 'prompt' ? 'Instrucciones' : 'Plantilla'}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
