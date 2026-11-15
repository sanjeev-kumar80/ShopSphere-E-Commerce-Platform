const SECRET_ASSIGNMENT = /\b(api[-_ ]?key|x-goog-api-key|authorization|access[-_ ]?token|refresh[-_ ]?token|token|password|passwd|secret|credential)\b(["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,"';&}]+)/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const COMMON_API_TOKEN = /\b(?:AIza[0-9A-Za-z_-]{20,}|gsk_[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9_-]{16,})\b/g;
const URL = /https?:\/\/[^\s"'<>]+/gi;
const AUTHORIZATION_HEADER = /\bAuthorization\s*:\s*Bearer\s+[^\s,";]+/gi;

const sanitizeDiagnostic = (error) => {
    const message = typeof error === "string"
        ? error
        : error?.message || "Unknown error";

    return String(message)
        .replace(URL, "[URL]")
        .replace(AUTHORIZATION_HEADER, "Authorization: Bearer [REDACTED]")
        .replace(SECRET_ASSIGNMENT, "$1$2[REDACTED]")
        .replace(BEARER_TOKEN, "Bearer [REDACTED]")
        .replace(COMMON_API_TOKEN, "[REDACTED]")
        .slice(0, 1000);
};

const logSafeDiagnostic = (scope, error) => {
    console.error(`[AI] ${scope}`, {
        name: error?.name || "Error",
        message: sanitizeDiagnostic(error)
    });
};

module.exports = { sanitizeDiagnostic, logSafeDiagnostic };
