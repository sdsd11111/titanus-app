import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query('SELECT * FROM clientes ORDER BY id DESC');
        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, telefono, fecha_vencimiento, fecha_nacimiento, deuda, inasistencias, estado } = body;

        const result = await query(
            'INSERT INTO clientes (nombre, telefono, fecha_vencimiento, fecha_nacimiento, deuda, inasistencias, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [nombre, telefono, fecha_vencimiento, fecha_nacimiento, deuda, inasistencias, estado]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
