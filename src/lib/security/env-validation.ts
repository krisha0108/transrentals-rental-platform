/**
 * Environment Variable Validation
 *
 * Validates required environment variables at build/startup time.
 * Call validateEnv() in your app initialization.
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
}

// Define environment variable requirements
const ENV_VARS: EnvVar[] = [
  // Critical - App won't work without these
  { name: 'DATABASE_URL', required: true, description: 'Prisma database connection string' },
  { name: 'NEXTAUTH_SECRET', required: true, description: 'NextAuth.js secret key' },
  { name: 'NEXTAUTH_URL', required: true, description: 'NextAuth.js callback URL' },

  // Important - Features may be limited
  { name: 'NEXT_PUBLIC_APP_URL', required: false, description: 'Public app URL for links' },
  { name: 'NEXT_PUBLIC_API_URL', required: false, description: 'Backend API URL' },

  // Optional - Nice to have
  { name: 'GOOGLE_CLIENT_ID', required: false, description: 'Google OAuth client ID' },
  { name: 'GOOGLE_CLIENT_SECRET', required: false, description: 'Google OAuth secret' },
];

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validates environment variables
 * @param throwOnError - If true, throws an error for missing required vars
 * @returns Validation result with missing and warning lists
 */
export function validateEnv(throwOnError = false): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(`${envVar.name} - ${envVar.description}`);
      } else {
        warnings.push(`${envVar.name} - ${envVar.description}`);
      }
    }
  }

  const valid = missing.length === 0;

  if (!valid && throwOnError) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(m => `  - ${m}`).join('\n')}`
    );
  }

  return { valid, missing, warnings };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get required env var or throw
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get env var with default fallback
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Log environment validation status (call at startup)
 */
export function logEnvStatus(): void {
  const { valid, missing, warnings } = validateEnv();

  if (isProduction()) {
    if (!valid) {
      console.error('[ENV] CRITICAL: Missing required environment variables:');
      missing.forEach(m => console.error(`  - ${m}`));
    }
    if (warnings.length > 0) {
      console.warn('[ENV] Optional variables not set:');
      warnings.forEach(w => console.warn(`  - ${w}`));
    }
  } else {
    // Dev mode - more verbose
    if (!valid) {
      console.warn('\x1b[31m[ENV] Missing required variables:\x1b[0m');
      missing.forEach(m => console.warn(`  \x1b[31m✗\x1b[0m ${m}`));
    }
    if (warnings.length > 0 && missing.length === 0) {
      console.info('\x1b[33m[ENV] Optional variables not set (features may be limited):\x1b[0m');
      warnings.slice(0, 3).forEach(w => console.info(`  \x1b[33m!\x1b[0m ${w}`));
      if (warnings.length > 3) {
        console.info(`  ... and ${warnings.length - 3} more`);
      }
    }
    if (valid && warnings.length === 0) {
      console.info('\x1b[32m[ENV] All environment variables configured ✓\x1b[0m');
    }
  }
}
