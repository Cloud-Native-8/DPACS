import { getValkeyClient } from "../clients/valkey.client.js";

function buildKey(userId) {
  return `anti-passback:${userId}`;
}

function parseState(rawState) {
  if (!rawState) {
    return null;
  }

  try {
    return JSON.parse(rawState);
  } catch {
    return null;
  }
}

export async function getLastAccessState(userId) {
  const client = await getValkeyClient();
  const rawState = await client.get(buildKey(userId));

  return {
    backend: "valkey",
    state: parseState(rawState),
  };
}

export async function rememberAccessState(userId, state) {
  const client = await getValkeyClient();
  const ttl = Number(process.env.ANTI_PASSBACK_TTL_SECONDS || 43200);
  await client.set(buildKey(userId), JSON.stringify(state), { EX: ttl });
}

export async function clearLastAccessState(userId) {
  const client = await getValkeyClient();
  await client.del(buildKey(userId));
}
