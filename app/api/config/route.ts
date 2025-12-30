import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('configuracion')
            .select('*');

        if (error) throw error;

        const configMap = data.reduce((acc: any, row: any) => {
            acc[row.clave] = row.valor;
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
        const { clave, valor } = body;

        const { error } = await supabaseAdmin
            .from('configuracion')
            .upsert({ clave, valor }, { onConflict: 'clave' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
