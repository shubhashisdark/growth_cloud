const DEFAULT_PORT = 4000;

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  corsOrigins: string[] | "*";
  authTokenSecret: string;
  appBaseUrl: string | null;
  apiBaseUrl: string;
  exposeResetTokenInResponse: boolean;
  emailProvider: string | null;
  emailFallbackProvider: string | null;
  emailFrom: string | null;
  resendApiKey: string | null;
  brevoApiKey: string | null;
}

function parsePort(raw: string | undefined) {
  const parsed = Number(raw ?? DEFAULT_PORT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function parseBoolean(raw: string | undefined, defaultValue: boolean) {
  if (raw === undefined) return defaultValue;
  return raw.toLowerCase() === "true";
}

function requireEnv(name: string, value: string | undefined) {
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required in production`);
  }
  return value;
}

function parseOptionalProvider(value: string | undefined) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "resend" || normalized === "brevo" || normalized === "console") {
    return normalized;
  }
  throw new Error(`Unsupported EMAIL_PROVIDER`);
}

function parseCorsOrigins(raw: string | undefined, isProduction: boolean): { corsOrigin: string; corsOrigins: string[] | "*" } {
  const value = (raw ?? (isProduction ? "" : "*")).trim();
  if (!value) {
    throw new Error("CORS_ORIGIN is required in production");
  }
  if (value === "*") {
    return { corsOrigin: "*", corsOrigins: "*" };
  }
  const list = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (list.length === 0) {
    throw new Error("CORS_ORIGIN must include at least one origin");
  }
  return { corsOrigin: list.join(","), corsOrigins: list };
}

export function getConfig(): AppConfig {
  const nodeEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";

  const authTokenSecret = isProduction
    ? requireEnv("AUTH_TOKEN_SECRET", process.env.AUTH_TOKEN_SECRET)
    : process.env.AUTH_TOKEN_SECRET ?? "dev-auth-secret";

  const appBaseUrl = isProduction
    ? requireEnv("APP_BASE_URL", process.env.APP_BASE_URL)
    : process.env.APP_BASE_URL ?? null;

  // Public backend URL used in email open/click tracking pixels.
  // Must be reachable from the internet (not localhost) for Gmail/etc. to report events.
  const apiBaseUrl =
    process.env.API_BASE_URL?.trim() ||
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    `http://localhost:${parsePort(process.env.PORT)}`;

  const { corsOrigin, corsOrigins } = isProduction
    ? parseCorsOrigins(requireEnv("CORS_ORIGIN", process.env.CORS_ORIGIN), true)
    : parseCorsOrigins(process.env.CORS_ORIGIN ?? "*", false);

  const emailProvider = parseOptionalProvider(process.env.EMAIL_PROVIDER);
  const emailFallbackProvider = parseOptionalProvider(process.env.EMAIL_FALLBACK_PROVIDER);
  const emailFrom = process.env.EMAIL_FROM ?? null;
  const resendApiKey = process.env.RESEND_API_KEY ?? null;
  const brevoApiKey = process.env.BREVO_API_KEY ?? null;

  if (isProduction && emailProvider && !emailFrom) {
    throw new Error("EMAIL_FROM is required in production when email delivery is enabled");
  }

  if (isProduction && emailProvider === "resend" && !resendApiKey) {
    throw new Error("RESEND_API_KEY is required in production when EMAIL_PROVIDER is resend");
  }

  if (isProduction && emailProvider === "brevo" && !brevoApiKey) {
    throw new Error("BREVO_API_KEY is required in production when EMAIL_PROVIDER is brevo");
  }

  if (isProduction && emailFallbackProvider === "resend" && !resendApiKey) {
    throw new Error("RESEND_API_KEY is required in production when EMAIL_FALLBACK_PROVIDER is resend");
  }

  if (isProduction && emailFallbackProvider === "brevo" && !brevoApiKey) {
    throw new Error("BREVO_API_KEY is required in production when EMAIL_FALLBACK_PROVIDER is brevo");
  }

  return {
    port: parsePort(process.env.PORT),
    nodeEnv,
    corsOrigin,
    corsOrigins,
    authTokenSecret,
    appBaseUrl,
    apiBaseUrl,
    exposeResetTokenInResponse: parseBoolean(process.env.RESET_TOKEN_EXPOSE_IN_RESPONSE, !isProduction),
    emailProvider,
    emailFallbackProvider,
    emailFrom,
    resendApiKey,
    brevoApiKey
  };
}
