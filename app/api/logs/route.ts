import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        const { data, error } = await supabaseAdmin
            .from('cola_mensajes')
            .select('*')
            .or('tipo.eq.log,nombre.eq.System Bot')
            .order('fecha_creacion', { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
