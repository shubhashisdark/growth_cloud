export interface GrowthCloudOptions {
    publicKey: string;
    baseUrl?: string;
    debug?: boolean;
    autoCaptureForms?: boolean;
}
export interface LeadTraits {
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    source?: string;
    status?: string;
    lifecycleStage?: "subscriber" | "lead" | "mql" | "sql" | "customer";
    customFields?: Record<string, unknown>;
    [key: string]: unknown;
}
export interface EventProperties {
    pageUrl?: string;
    pageTitle?: string;
    referrer?: string;
    value?: number;
    currency?: string;
    category?: string;
    [key: string]: unknown;
}
export interface LeadSyncData extends LeadTraits {
    email: string;
}
export interface FormSubmitData {
    formId: string;
    email: string;
    fields: Record<string, unknown>;
}
export interface SDKResponse<T = Record<string, unknown>> {
    success: boolean;
    data: T | null;
    error: {
        code: string;
        message: string;
    } | null;
}
