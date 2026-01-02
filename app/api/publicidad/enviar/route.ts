import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { exec } from 'child_process';
import path from 'path';

// Helper for system logs
async function logSystem(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    await supabaseAdmin.from('cola_mensajes').insert({
        nombre: 'System API',
        telefono: '0000000000',
        tipo: 'log',
        mensaje: msg,
        estado: type,
        fecha_creacion: new Date().toISOString()
    });
}

export async function POST(request: Request) {
    try {
        await logSystem("🟡 API: Iniciando solicitud de envío masivo...");

        // 1. Obtener Configuración Actual
        const { data: configsData } = await supabaseAdmin
            .from('configuracion')
            .select('clave, valor');

        const config: any = {};
        configsData?.forEach((row: any) => {
            config[row.clave] = row.valor;
        });

        const mensajeBase = config['prompt_publicidad_static'];
        const imagenUrl = config['publicidad_imagen'];

        if (!mensajeBase) {
            await logSystem("❌ Error: Intento de envío sin mensaje configurado.", 'error');
            return NextResponse.json({ error: "No hay un mensaje configurado. Por favor edita y GUARDA el 'Mensaje Fijo' antes de enviar." }, { status: 400 });
        }

        // 2. Obtener Clientes Activos
        const { data: clientes, error: clientesError } = await supabaseAdmin
            .from('clientes')
            .select('nombre, telefono')
            .or('estado.eq.activo,estado.is.null');

        if (clientesError) throw clientesError;
        if (!clientes || clientes.length === 0) {
            await logSystem("⚠️ No se encontraron clientes activos.", 'error');
            return NextResponse.json({ error: "No hay clientes activos para enviar." }, { status: 400 });
        }

        // 3. Preparar Mensajes
        await logSystem(`ℹ️ Generando mensajes para ${clientes.length} clientes...`, 'info');

        const mensajesParaInsertar = clientes.map(c => {
            let texto = mensajeBase.replace(/{{Nombre}}/gi, c.nombre || "Guerrero");

            // Adjuntar prefijo de imagen si existe
            if (imagenUrl && imagenUrl.length > 5) {
                texto = `[MEDIA:${imagenUrl}] ${texto}`;
            }

            return {
                nombre: c.nombre,
                telefono: c.telefono,
                tipo: 'publicidad',
                mensaje: texto,
                estado: 'pendiente',
                fecha_creacion: new Date().toISOString()
            };
        });

        // 4. Insertar en Lotes (Batches de 100)
        const batchSize = 100;
        for (let i = 0; i < mensajesParaInsertar.length; i += batchSize) {
            const batch = mensajesParaInsertar.slice(i, i + batchSize);
            const { error: insertError } = await supabaseAdmin
                .from('cola_mensajes')
                .insert(batch);

            if (insertError) {
                console.error("Error insertando batch:", insertError);
                throw insertError;
            }
        }

        await logSystem(`✅ Encolados ${mensajesParaInsertar.length} mensajes exitosamente.`, 'success');

        // 5. Despertar al Bot (SSH Trigger al VPS)
        // Usamos path absoluto fijo para entorno Windows del usuario
        const sshKeyPath = "d:\\Abel paginas\\Mensaje whatsap automaticos\\ssh_key_test";

        // Ejecutar worker en background con filtro de tipo
        const sshCmd = `ssh -i "${sshKeyPath}" -o StrictHostKeyChecking=no ubuntu@129.153.116.213 "cd /home/ubuntu/titanus-gym && nohup python3 birthday_bot.py worker --type publicidad > worker_manual.log 2>&1 &"`;

        await logSystem("🚀 Enviando señal de despertar al servidor...", 'info');

        exec(sshCmd, (error, stdout, stderr) => {
            if (error) {
                console.error("SSH Trigger failed:", error);
                logSystem(`⚠️ No se pudo despertar al bot automáticamente: ${error.message}`, 'error');
            } else {
                console.log("Bot triggered successfully:", stdout);
                logSystem("📡 Bot despertado correctamente. El envío ha comenzado.", 'success');
            }
        });

        return NextResponse.json({
            success: true,
            count: mensajesParaInsertar.length,
            message: `Encolados ${mensajesParaInsertar.length} mensajes. Bot activado.`
        });

    } catch (error: any) {
        console.error("Broadcast Error:", error);
        await logSystem(`❌ Error crítico en API de envío: ${error.message}`, 'error');
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
