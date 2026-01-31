import { NextResponse } from 'next/server';

/**
 * Health check endpoint for uptime monitoring services.
 * Used to keep Render free tier from sleeping.
 * 
 * GET /api/health
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
}
