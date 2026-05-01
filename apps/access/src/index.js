import app from "./app.js";
import { checkValkeyConnection } from "./clients/valkey.client.js";

const port = Number(process.env.ACCESS_PORT || 4000);

app.listen(port, async () => {
  console.log(`access listening on port ${port}`);
  await checkValkeyConnection();
});
