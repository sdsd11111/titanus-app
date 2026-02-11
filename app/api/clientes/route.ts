import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
        return NextResponse.json(rows);
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

        const [result] = await pool.query(
            'INSERT INTO clientes (nombre, telefono, fecha_nacimiento, fecha_vencimiento, deuda, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, telefono, fecha_nacimiento || null, fecha_vencimiento || null, deuda || 0, estado || 'activo']
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
