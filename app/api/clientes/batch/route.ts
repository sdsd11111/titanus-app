import { NextResponse } from 'next/server';
import pool from '@/lib/mysql';

// Helper to clean phone numbers (handles scientific notation and strings)
function cleanPhoneNumber(phone: any): string {
    if (!phone) return '';
    let phoneStr = String(phone).trim();

    // Handle scientific notation e.g. "5.93967E+11" or "5,93967E+11"
    if (phoneStr.toUpperCase().includes('E+')) {
        try {
            const normalized = phoneStr.replace(',', '.');
            const num = parseFloat(normalized);
            if (!isNaN(num)) {
                phoneStr = num.toLocaleString('fullwide', { useGrouping: false });
            }
        } catch (e) {
            console.warn('Failed to parse scientific notation phone:', phoneStr);
        }
    }

    // Remove anything that is not a digit
    phoneStr = phoneStr.replace(/\D/g, '');

    return phoneStr;
}

// Convert Excel serial number or verify date string
function parseDate(input: any): string | null {
    if (!input) return null;

    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return input;
    }

    if (typeof input === 'string' && input.includes('/')) {
        const parts = input.split('/');
        if (parts.length === 3) {
            let day = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let year = parseInt(parts[2]);

            if (year < 100) year += 2000;

            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
    }

    const serialNum = Number(input);
    if (!isNaN(serialNum) && serialNum > 20000) {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + serialNum * 86400000);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return null;
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.json();

        if (!Array.isArray(rawBody)) {
            return NextResponse.json({ error: "Formato inválido. Se espera un array de clientes." }, { status: 400 });
        }

        const uniqueClients = new Map<string, any>();

        for (const client of rawBody) {
            const cleanPhone = cleanPhoneNumber(client.telefono);
            if (!cleanPhone || cleanPhone.length < 5) continue;

            const processedClient = {
                telefono: cleanPhone,
                nombre: client.nombre ? String(client.nombre).trim() : 'Sin Nombre',
                fecha_vencimiento: parseDate(client.fecha_vencimiento),
                fecha_nacimiento: parseDate(client.fecha_nacimiento),
                estado: 'activo',
                deuda: client.deuda ? Number(client.deuda) : 0,
                inasistencias: client.inasistencias ? Number(client.inasistencias) : 0
            };

            uniqueClients.set(cleanPhone, processedClient);
        }

        const clientsToUpsert = Array.from(uniqueClients.values());

        if (clientsToUpsert.length === 0) {
            return NextResponse.json({
                message: "No se encontraron clientes válidos para procesar.",
                stats: { total: 0, inserted_or_updated: 0, errors: 0 }
            });
        }

        console.log(`Processing batch: ${rawBody.length} rows -> ${clientsToUpsert.length} unique clients`);

        // Batch UPSERT for MySQL
        // We do this by iterating for now, or using a complex query. 
        // For simplicity and to avoid query length limits, we'll process them in the pool.
        let insertedOrUpdated = 0;
        for (const client of clientsToUpsert) {
            await pool.query(
                `INSERT INTO clientes (telefono, nombre, fecha_vencimiento, fecha_nacimiento, estado, deuda, inasistencias) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 nombre = VALUES(nombre), 
                 fecha_vencimiento = VALUES(fecha_vencimiento), 
                 fecha_nacimiento = VALUES(fecha_nacimiento), 
                 estado = VALUES(estado), 
                 deuda = VALUES(deuda), 
                 inasistencias = VALUES(inasistencias)`,
                [client.telefono, client.nombre, client.fecha_vencimiento, client.fecha_nacimiento, client.estado, client.deuda, client.inasistencias]
            );
            insertedOrUpdated++;
        }

        return NextResponse.json({
            message: "Carga masiva completada exitosamente",
            stats: {
                total: rawBody.length,
                inserted_or_updated: insertedOrUpdated,
                errors: 0
            }
        });

    } catch (error: any) {
        console.error("Batch Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
