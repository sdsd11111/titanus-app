import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://129.153.116.213:8080';
        const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
        const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'gym_bot';

        console.log(`Attempting to logout instance: ${EVOLUTION_INSTANCE_NAME}`);

        const response = await fetch(
            `${EVOLUTION_API_URL}/instance/logout/${EVOLUTION_INSTANCE_NAME}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': EVOLUTION_API_KEY || '',
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();
        console.log('Logout response:', data);

        if (!response.ok && response.status !== 404) { // 404 might mean already logged out
            console.error('Logout failed:', data);
            // Verify if it's actually disconnected despite the error (sometimes APIs are quirky)
            // But for now, throw error
            throw new Error(data.message || 'Failed to logout instance');
        }

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error: any) {
        console.error('Error logging out:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to logout'
        }, { status: 500 });
    }
}
