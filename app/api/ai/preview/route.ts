import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { provider, apiKey, prompt, variables } = body;
        // Force refresh: 2025-12-31 16:45
        // Fetch API key from DB if not provided (safety) but generally passed from FE or checking DB
        let finalApiKey = apiKey;

        if (finalApiKey === "******** (Configurado)") {
            finalApiKey = "";
        }

        if (!finalApiKey && (provider === 'openai' || provider === 'gemini')) {
            const { data } = await supabaseAdmin.from('configuracion').select('*').in('clave', ['openai_api_key', 'gemini_api_key']);
            if (data) {
                const map: any = {};
                data.forEach((r: any) => map[r.clave] = r.valor);
                if (provider === 'openai') finalApiKey = map['openai_api_key'];
                if (provider === 'gemini') finalApiKey = map['gemini_api_key'];
            }
        }

        if (!finalApiKey) {
            return NextResponse.json({ result: "⚠️ Falta la API Key del proveedor seleccionado. Guárdala primero." });
        }

        // Replace variables
        let filledPrompt = prompt;
        // Mock data defaults
        const mockData: any = {
            "Nombre": variables.Nombre || "Spartacus",
            "FechaVencimiento": variables.FechaVencimiento || "mañana",
            "DíasInactividad": variables.DíasInactividad || "5"
        };

        // Simple replace {{Key}}
        for (const [key, val] of Object.entries(mockData)) {
            filledPrompt = filledPrompt.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }

        let aiResponse = "";

        if (provider === 'openai') {
            const { data: modelData } = await supabaseAdmin.from('configuracion').select('valor').eq('clave', 'openai_model').single();
            const selectedModel = modelData?.valor || "gpt-3.5-turbo";

            const url = "https://api.openai.com/v1/chat/completions";
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${finalApiKey}`
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: "system", content: "Eres un asistente de Titanus Fitness." },
                        { role: "user", content: filledPrompt }
                    ]
                })
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error.message);
            aiResponse = json.choices[0].message.content;
        }
        else if (provider === 'gemini') {
            // 1. Discover available models first
            console.log("DEBUG: Discovering models for Gemini...");
            const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${finalApiKey}`;
            let bestModel = "";

            try {
                const listRes = await fetch(listUrl);
                const listJson = await listRes.json();

                if (listJson.models) {
                    const available = listJson.models
                        .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
                        .map((m: any) => m.name.replace('models/', ''));

                    // Priority list: 2.0-flash, 1.5-flash, pro, others
                    const priority = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-pro', 'gemini-pro-latest'];
                    bestModel = priority.find(p => available.includes(p)) || available[0] || "gemini-pro";
                    console.log(`DEBUG: Auto-selected model: ${bestModel}`);
                } else {
                    console.warn("DEBUG: Could not list models, falling back to gemini-pro");
                    bestModel = "gemini-pro";
                }
            } catch (e) {
                console.error("DEBUG: Discovery failed:", e);
                bestModel = "gemini-pro";
            }

            // 2. Call the best model
            const url = `https://generativelanguage.googleapis.com/v1/models/${bestModel}:generateContent?key=${finalApiKey}`;
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: filledPrompt }] }]
                })
            });

            const json = await res.json();
            if (json.error) throw new Error(json.error.message);
            aiResponse = json.candidates?.[0]?.content?.parts?.[0]?.text || `Model ${bestModel} responded, but no text found.`;
        }
        else {
            aiResponse = "Proveedor no soportado para preview.";
        }

        return NextResponse.json({ result: aiResponse });

    } catch (error: any) {
        console.error("AI Preview Error:", error);
        let userMessage = error.message;

        if (userMessage.includes("Quota exceeded") || userMessage.includes("quota")) {
            userMessage = "⚠️ Límite de Google alcanzado (Cuota Excedida). \n\nEsto sucede porque la cuenta es nueva o ha enviado demasiadas solicitudes seguidas. \n\nPor favor, espera 1 minuto y vuelve a intentar. Si persiste, revisa que el Pago esté configurado en Google Cloud o usa una API Key diferente.";
        }

        // Regresar 200 para que el frontend muestre el mensaje de error en la caja de texto
        return NextResponse.json({ result: userMessage });
    }
}
