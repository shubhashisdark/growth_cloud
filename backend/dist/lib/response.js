export function sendSuccess(response, data, meta = {}) {
    return response.json({
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
        error: null,
    });
}
export function sendError(response, code, message, status = 400, details) {
    return response.status(status).json({
        data: null,
        meta: {
            timestamp: new Date().toISOString(),
        },
        error: {
            code,
            message,
            details,
        },
    });
}
