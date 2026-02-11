import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const limit = 50;
    const offset = (page - 1) * limit;

    try {
        let whereClause = "WHERE tipo != 'log' AND nombre != 'System Bot'";
        let queryParams: any[] = [];

        if (search) {
            whereClause += " AND (nombre LIKE ? OR telefono LIKE ? OR tipo LIKE ?)";
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        // 1. Get total count
        const [countResult]: any = await pool.query(
            `SELECT COUNT(*) as total FROM cola_mensajes ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // 2. Get paginated items
        const [rows]: any = await pool.query(
            `SELECT * FROM cola_mensajes ${whereClause} ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );

        return NextResponse.json({
            items: rows,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
