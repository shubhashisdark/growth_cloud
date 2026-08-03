import { GrowthCloud, init, getClient } from "./client.js";

declare global {
  interface Window {
    growthcloud?: {
      init: typeof init;
      identify: InstanceType<typeof GrowthCloud>["identify"];
      track: InstanceType<typeof GrowthCloud>["track"];
      leadSync: InstanceType<typeof GrowthCloud>["leadSync"];
      submitForm: InstanceType<typeof GrowthCloud>["submitForm"];
    };
  }
}

if (typeof window !== "undefined") {
  window.growthcloud = {
    init,
    identify: (email, traits) => getClient().identify(email, traits),
    track: (event, props) => getClient().track(event, props),
    leadSync: (data) => getClient().leadSync(data),
    submitForm: (formId, data) => getClient().submitForm(formId, data),
  };
}

export { GrowthCloud, init, getClient };
