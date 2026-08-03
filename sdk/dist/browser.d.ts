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
export { GrowthCloud, init, getClient };
