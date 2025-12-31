import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://129.153.116.213:8080';
        const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
        const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'gym_bot';

        const response = await fetch(
            `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY || ''
                }
            }
        );

        const data = await response.json();

        // Evolution API v2.3.7 returns: { instance: { instanceName: "gym_bot", state: "open" } }
        const state = data?.instance?.state || data?.state || 'close';
        const isConnected = state === 'open';

        return NextResponse.json({
            connected: isConnected,
            state: state,
            instance: EVOLUTION_INSTANCE_NAME,
            version: '2.3.7'
        });
    } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        return NextResponse.json({
            connected: false,
            state: 'error',
            error: 'Failed to check status'
        }, { status: 500 });
    }
}
