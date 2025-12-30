import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        let query = supabaseAdmin
            .from('cola_mensajes')
            .select('*', { count: 'exact' })
            .order('fecha_creacion', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(`nombre.ilike.%${search}%,telefono.ilike.%${search}%,tipo.ilike.%${search}%`);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            items: data,
            pagination: {
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
                currentPage: page
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
