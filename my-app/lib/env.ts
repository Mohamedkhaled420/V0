export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
} as const

// Validate required environment variables
export function validateEnv() {
  const requiredVars = ["GEMINI_API_KEY"] as const

  for (const varName of requiredVars) {
    if (!env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`)
    }
  }
}

// Type-safe environment variable access
export function getEnvVar(key: keyof typeof env): string {
  const value = env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`)
  }
  return value
}
