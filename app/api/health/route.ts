import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';export const runtime = 'nodejs';
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'lovento API is running'
  })
}