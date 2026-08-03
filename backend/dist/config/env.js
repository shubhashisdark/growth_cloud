const DEFAULT_PORT = 4000;
function parsePort(raw) {
    const parsed = Number(raw ?? DEFAULT_PORT);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}
function parseBoolean(raw, defaultValue) {
    if (raw === undefined)
        return defaultValue;
    return raw.toLowerCase() === "true";
}
function requireEnv(name, value) {
    if (!value || value.trim() === "") {
        throw new Error(`${name} is required in production`);
    }
    return value;
}
function parseOptionalProvider(value) {
    if (!value)
        return null;
    const normalized = value.toLowerCase();
    if (normalized === "resend" || normalized === "brevo" || normalized === "console") {
        return normalized;
    }
    throw new Error(`Unsupported EMAIL_PROVIDER`);
}
export function getConfig() {
    const nodeEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
    const isProduction = nodeEnv === "production";
    const authTokenSecret = isProduction
        ? requireEnv("AUTH_TOKEN_SECRET", process.env.AUTH_TOKEN_SECRET)
        : process.env.AUTH_TOKEN_SECRET ?? "dev-auth-secret";
    const appBaseUrl = isProduction
        ? requireEnv("APP_BASE_URL", process.env.APP_BASE_URL)
        : process.env.APP_BASE_URL ?? null;
    const corsOrigin = isProduction
        ? requireEnv("CORS_ORIGIN", process.env.CORS_ORIGIN)
        : process.env.CORS_ORIGIN ?? "*";
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
        authTokenSecret,
        appBaseUrl,
        exposeResetTokenInResponse: parseBoolean(process.env.RESET_TOKEN_EXPOSE_IN_RESPONSE, !isProduction),
        emailProvider,
        emailFallbackProvider,
        emailFrom,
        resendApiKey,
        brevoApiKey
    };
}
