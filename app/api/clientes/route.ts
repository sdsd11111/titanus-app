import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('clientes')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, telefono, fecha_vencimiento, fecha_nacimiento, deuda, inasistencias, estado } = body;

        const { data, error } = await supabaseAdmin
            .from('clientes')
            .insert([
                { nombre, telefono, fecha_vencimiento, fecha_nacimiento, deuda, inasistencias, estado }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
