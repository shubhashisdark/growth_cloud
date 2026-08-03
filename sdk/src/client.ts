import type { GrowthCloudOptions, LeadTraits, EventProperties, LeadSyncData, FormSubmitData, SDKResponse } from "./types.js";

export class GrowthCloud {
  private publicKey: string;
  private baseUrl: string;
  private debug: boolean;

  constructor(options: GrowthCloudOptions) {
    if (!options.publicKey) {
      throw new Error("[GrowthCloud SDK] publicKey is required.");
    }
    this.publicKey = options.publicKey;
    this.baseUrl = (options.baseUrl || "http://localhost:4000").replace(/\/$/, "");
    this.debug = !!options.debug;

    if (this.debug) {
      console.log(`[GrowthCloud SDK] Initialized with key: ${this.publicKey.slice(0, 10)}...`);
    }
  }

  private async request<T = Record<string, unknown>>(endpoint: string, data: Record<string, unknown>): Promise<SDKResponse<T>> {
    const url = `${this.baseUrl}/api/v1/sdk${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GrowthCloud-Public-Key": this.publicKey,
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      if (!response.ok) {
        if (this.debug) console.error(`[GrowthCloud SDK] Request failed (${response.status}):`, json);
        return { success: false, data: null, error: json.error || { code: "REQUEST_FAILED", message: `HTTP ${response.status}` } };
      }

      if (this.debug) console.log(`[GrowthCloud SDK] Request success:`, json);
      return { success: true, data: json.data, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      if (this.debug) console.error(`[GrowthCloud SDK] Network error:`, msg);
      return { success: false, data: null, error: { code: "NETWORK_ERROR", message: msg } };
    }
  }

  /**
   * Identify a lead and update traits
   */
  async identify(email: string, traits?: LeadTraits): Promise<SDKResponse> {
    if (!email) throw new Error("[GrowthCloud SDK] email is required for identify()");
    return this.request("/identify", { email, traits: traits || {} });
  }

  /**
   * Track a custom behavioral event
   */
  async track(eventName: string, properties?: EventProperties): Promise<SDKResponse> {
    if (!eventName) throw new Error("[GrowthCloud SDK] eventName is required for track()");
    return this.request("/track", {
      event: eventName,
      properties: {
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        referrer: typeof window !== "undefined" ? document.referrer : undefined,
        ...properties,
      },
    });
  }

  /**
   * Synchronize full lead data with Growth Cloud backend
   */
  async leadSync(leadData: LeadSyncData): Promise<SDKResponse> {
    if (!leadData.email) throw new Error("[GrowthCloud SDK] leadData.email is required for leadSync()");
    return this.request("/lead-sync", { lead: leadData });
  }

  /**
   * Submit form submission data automatically or manually
   */
  async submitForm(formId: string, formData: Record<string, unknown>): Promise<SDKResponse> {
    if (!formId) throw new Error("[GrowthCloud SDK] formId is required for submitForm()");
    return this.request("/form", { formId, data: formData });
  }
}

/**
 * Singleton convenience instance initialization helper
 */
let globalInstance: GrowthCloud | null = null;

export function init(options: GrowthCloudOptions): GrowthCloud {
  globalInstance = new GrowthCloud(options);

  if (typeof window !== "undefined" && options.autoCaptureForms) {
    setupFormAutoCapture(globalInstance);
  }

  return globalInstance;
}

export function getClient(): GrowthCloud {
  if (!globalInstance) {
    throw new Error("[GrowthCloud SDK] SDK not initialized. Call init({ publicKey: '...' }) first.");
  }
  return globalInstance;
}

function setupFormAutoCapture(client: GrowthCloud) {
  if (typeof window === "undefined" || !window.document) return;

  window.document.addEventListener("submit", (event) => {
    const target = event.target as HTMLFormElement;
    if (!target || target.tagName !== "FORM") return;

    const formId = target.id || target.getAttribute("name") || "default_form";
    const formData = new FormData(target);
    const data: Record<string, unknown> = {};

    formData.forEach((val, key) => {
      data[key] = val;
    });

    const email = (data.email as string) || (data.work_email as string);
    if (email) {
      client.identify(email, data);
    }

    client.submitForm(formId, data);
  });
}
