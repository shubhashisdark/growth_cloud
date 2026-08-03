import { GrowthCloud, init, getClient } from "./client.js";
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
