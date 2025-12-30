import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
        const rawBody = await request.json();

        // 1. Validar input
        if (!Array.isArray(rawBody)) {
            return NextResponse.json({ error: "Formato inválido. Se espera un array de clientes." }, { status: 400 });
        }

        // 2. Preprocesar datos (convertir fechas, normalizar campos)
        const clientsToUpsert = rawBody.map(client => ({
            telefono: client.telefono, // Clave única para Upsert
            nombre: client.nombre,
            fecha_vencimiento: excelSerialToDate(client.fecha_vencimiento),
            fecha_nacimiento: excelSerialToDate(client.fecha_nacimiento),
            estado: 'activo', // Default al importar
            deuda: client.deuda || 0,
            inasistencias: client.inasistencias || 0
        }));

        // 3. Realizar UPSERT masivo con Supabase (Mucho más eficiente que loop 1 a 1)
        // onConflict: 'telefono' usará la constraint UNIQUE de telefono para actualizar si existe o insertar si no.
        const { data, error } = await supabaseAdmin
            .from('clientes')
            .upsert(clientsToUpsert, { onConflict: 'telefono', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error("Supabase Batch Upsert Error:", error);
            throw new Error(error.message);
        }

        // Calcular estadísticas aproximadas (Upsert no diferencia insert/update fácilmente en retorno masivo)
        const totalProcessed = data?.length || 0;

        return NextResponse.json({
            message: "Carga masiva completada exitosamente",
            stats: {
                total: totalProcessed,
                inserted_or_updated: totalProcessed,
                errors: 0
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
