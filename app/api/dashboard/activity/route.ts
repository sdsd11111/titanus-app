import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const limit = 50;
    const offset = (page - 1) * limit;

    try {
        let sql = "SELECT * FROM cola_mensajes";
        const params: any[] = [];

        if (search) {
            sql += " WHERE nombre ILIKE $1 OR telefono ILIKE $1 OR tipo ILIKE $1";
            params.push(`%${search}%`);
        }

        const countQuery = await query(`SELECT COUNT(*) FROM (${sql}) AS sub`, params);
        const totalItems = parseInt(countQuery.rows[0].count);

        sql += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        return NextResponse.json({
            items: result.rows,
            pagination: {
                total: totalItems,
                pages: Math.ceil(totalItems / limit),
                currentPage: page
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
