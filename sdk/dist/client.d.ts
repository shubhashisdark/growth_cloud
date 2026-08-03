import type { GrowthCloudOptions, LeadTraits, EventProperties, LeadSyncData, SDKResponse } from "./types.js";
export declare class GrowthCloud {
    private publicKey;
    private baseUrl;
    private debug;
    constructor(options: GrowthCloudOptions);
    private request;
    /**
     * Identify a lead and update traits
     */
    identify(email: string, traits?: LeadTraits): Promise<SDKResponse>;
    /**
     * Track a custom behavioral event
     */
    track(eventName: string, properties?: EventProperties): Promise<SDKResponse>;
    /**
     * Synchronize full lead data with Growth Cloud backend
     */
    leadSync(leadData: LeadSyncData): Promise<SDKResponse>;
    /**
     * Submit form submission data automatically or manually
     */
    submitForm(formId: string, formData: Record<string, unknown>): Promise<SDKResponse>;
}
export declare function init(options: GrowthCloudOptions): GrowthCloud;
export declare function getClient(): GrowthCloud;
