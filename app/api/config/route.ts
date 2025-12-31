import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('configuracion')
            .select('*');

        if (error) throw error;

        const configMap = data.reduce((acc: any, row: any) => {
            let valor = row.valor;
            // Full hardening: Don't even send masked keys to the frontend
            if (row.clave.includes('_api_key') && valor && valor.length > 5) {
                valor = "******** (Configurado)";
            }
            acc[row.clave] = valor;
            return acc;
        }, {});

        return NextResponse.json(configMap);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let { clave, valor } = body;

        // Validation & Safety
        if (!clave || typeof clave !== 'string') return NextResponse.json({ error: "Clave inválida" }, { status: 400 });

        // Sanitize clave
        clave = clave.replace(/[^a-zA-Z0-9_]/g, '');

        // AI Safety: Limit prompt length to 2000 chars
        if (clave.startsWith('prompt_') && valor && valor.length > 2000) {
            valor = valor.substring(0, 2000);
        }

        // IMPORTANT FIX: Don't save if it's the privacy placeholder
        if (valor === "******** (Configurado)") {
            return NextResponse.json({ success: true });
        }

        const { error } = await supabaseAdmin
            .from('configuracion')
            .upsert({ clave, valor }, { onConflict: 'clave' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
