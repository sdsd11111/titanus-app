
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
    try {
        // Borrar todos los mensajes de la cola (para reiniciar pruebas)
        const { error, count } = await supabaseAdmin
            .from('cola_mensajes')
            .delete({ count: 'exact' })
            .gt('id', 0); // Borra todo sin condiciones complejas

        if (error) throw error;

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
