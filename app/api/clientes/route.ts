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
        let { nombre, telefono, fecha_nacimiento, fecha_vencimiento, deuda, estado } = body;

        // Validation & Sanitization
        if (!nombre || !telefono) throw new Error("Nombre y teléfono son obligatorios");

        nombre = nombre.substring(0, 100).replace(/[<>]/g, ''); // Basic XSS prev
        telefono = telefono.replace(/[^0-9+]/g, '').substring(0, 20);

        const { error } = await supabaseAdmin
            .from('clientes')
            .insert({
                nombre,
                telefono,
                fecha_nacimiento: fecha_nacimiento || null,
                fecha_vencimiento: fecha_vencimiento || null,
                deuda: deuda || 0,
                estado: estado || 'activo'
            });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
