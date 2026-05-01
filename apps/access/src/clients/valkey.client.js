import { createClient } from "redis";

let clientPromise;

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getValkeyClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient({ url: required("VALKEY_URL") });

      client.on("error", (error) => {
        console.warn("[valkey] connection error", error.message);
      });

      await client.connect();
      return client;
    })();
  }

  return clientPromise;
}

export async function checkValkeyConnection() {
  const client = await getValkeyClient();

  return {
    backend: "valkey",
    connected: Boolean(client)
  };
}
