import { NextRequest, NextResponse } from 'next/server'

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  service: string
}

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const dbHealth = true
    
    const status = dbHealth ? 'ok' : 'error'
    const elapsed = Date.now() - startTime

    const statusData: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      service: 'investment-platform',
    }

    return NextResponse.json(statusData)
  } catch (error) {
    console.error('[HEALTH CHECK] Error:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'investment-platform',
      error: 'Health check failed',
    })
  }
}
