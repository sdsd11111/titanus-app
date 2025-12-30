import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Convert Excel serial number to date string (YYYY-MM-DD)
function excelSerialToDate(serial: any): string | null {
    if (!serial) return null;

    // If it's already a valid date string, return it
    if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(serial)) {
        return serial;
    }

    // If it's an Excel serial number (numeric)
    const serialNum = Number(serial);
    if (!isNaN(serialNum) && serialNum > 0) {
        // Excel epoch starts at December 30, 1899
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + serialNum * 86400000);

        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    return null;
}

export async function POST(request: Request) {
    try {
        const clients = await request.json();

        if (!Array.isArray(clients)) {
            return NextResponse.json({ error: "Invalid data format. Expected an array." }, { status: 400 });
        }

        const stats = {
            inserted: 0,
            updated: 0,
            errors: 0
        };

        for (const client of clients) {
            try {
                // Convert dates if they are Excel serial numbers
                const fecha_vencimiento = excelSerialToDate(client.fecha_vencimiento);
                const fecha_nacimiento = excelSerialToDate(client.fecha_nacimiento);

                // Check if client exists
                const checkResult = await query(
                    'SELECT id FROM clientes WHERE telefono = $1',
                    [client.telefono]
                );

                if (checkResult.rows.length > 0) {
                    // UPDATE existing client
                    await query(
                        'UPDATE clientes SET nombre = $1, fecha_vencimiento = $2, fecha_nacimiento = $3, estado = $4 WHERE telefono = $5',
                        [client.nombre, fecha_vencimiento, fecha_nacimiento, 'activo', client.telefono]
                    );
                    stats.updated++;
                } else {
                    // INSERT new client
                    await query(
                        'INSERT INTO clientes (nombre, telefono, fecha_vencimiento, fecha_nacimiento, estado) VALUES ($1, $2, $3, $4, $5)',
                        [client.nombre, client.telefono, fecha_vencimiento, fecha_nacimiento, 'activo']
                    );
                    stats.inserted++;
                }
            } catch (e: any) {
                console.error(`Error processing client ${client.telefono}:`, e.message);
                stats.errors++;
            }
        }

        return NextResponse.json({
            message: "Batch processing completed",
            stats
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
