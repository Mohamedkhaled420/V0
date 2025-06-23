import { NextResponse } from "next/server"
import { validateEnv } from "@/lib/env"

export async function GET() {
  try {
    // Validate environment variables
    validateEnv()

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apiConfigured: !!process.env.GEMINI_API_KEY,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
