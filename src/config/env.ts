function getEnv(name: string, required = true, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value && required) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment variable "${name}" is required in production`);
    }
    console.warn(`⚠️ Missing ${name}, using default for development`);
    return defaultValue || '';
  }
  return value!;
}

export const env = {
  NODE_ENV: getEnv("NODE_ENV", false, "development"),
  PORT: parseInt(getEnv("PORT", false, "3000")),
  JWT_SECRET: getEnv("JWT_SECRET", true, "dev-secret-change-me"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", false, "7d"),
  DB_URL: getEnv("DATABASE_URL", true),
  SMTP_HOST: getEnv("SMTP_HOST", false, ""),
  SMTP_PORT: parseInt(getEnv("SMTP_PORT", false, "587")),
  SMTP_USER: getEnv("SMTP_USER", false, ""),
  SMTP_PASS: getEnv("SMTP_PASS", false, ""),
  DEFAULT_FROM_EMAIL: getEnv("DEFAULT_FROM_EMAIL", false, "noreply@loadrider.com"),
  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY", true, "sk_test_default"),
  STRIPE_PUBLISHABLE_KEY: getEnv("STRIPE_PUBLISHABLE_KEY", true, "pk_test_default"),
  STRIPE_WEBHOOK_SECRET: getEnv("STRIPE_WEBHOOK_SECRET", false, ""),
  STRIPE_CONNECT_CLIENT_ID: getEnv("STRIPE_CONNECT_CLIENT_ID", false, ""),
  FRONTEND_URL: getEnv("FRONTEND_URL", false, "http://localhost:3000"),
};
