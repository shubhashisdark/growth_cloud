import { getConfig } from "./config/env.js";
import { createApp } from "./app.js";
const config = getConfig();
const app = createApp();
app.listen(config.port, () => {
    console.log(`Growth Cloud backend listening on port ${config.port} in ${config.nodeEnv} mode`);
});
