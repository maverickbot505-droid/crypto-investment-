import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const genericError = { error: 'Not found', status: 404, timestamp: new Date().toISOString() }
    return NextResponse.json(genericError, { status: 404 })
  } catch (error) {
    console.error('[ERROR ROUTE] Generic error:', error)
    const genericError = { error: 'Internal server error', status: 500, timestamp: new Date().toISOString() }
    return NextResponse.json(genericError, { status: 500 })
  }
}
