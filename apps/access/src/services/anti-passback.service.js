import { getValkeyClient } from "../clients/valkey.client.js";

function buildKey(employee_id) {
  return `anti-passback:${employee_id}`;
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

export async function getLastAccessState(employee_id) {
  const client = await getValkeyClient();
  const rawState = await client.get(buildKey(employee_id));

  return {
    backend: "valkey",
    state: parseState(rawState),
  };
}

export async function rememberAccessState(employee_id, state) {
  const client = await getValkeyClient();
  const ttl = Number(process.env.ANTI_PASSBACK_TTL_SECONDS || 43200);
  await client.set(buildKey(employee_id), JSON.stringify(state), { EX: ttl });
}

export async function clearLastAccessState(employee_id) {
  const client = await getValkeyClient();
  await client.del(buildKey(employee_id));
}
