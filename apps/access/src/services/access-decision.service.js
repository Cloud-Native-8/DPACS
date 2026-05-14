import {
  createAccessCheckedEvent,
  parseAccessRequest,
  sendAccessEvent,
} from "@repo/queue";
import {
  clearLastAccessState,
  getLastAccessState,
  rememberAccessState,
} from "./anti-passback.service.js";
console.log("LOADED NEW access-decision.service.js", new Date().toISOString());
export function evaluateAntiPassback(request, previousState) {
  const isEntry = request.direction === "in";

  if (!previousState) {
    if (!isEntry) {
      return {
        allowed: false,
        reason: "Anti-passback blocked: employee is not marked inside any site",
      };
    }

    return {
      allowed: true,
      reason: "Access granted",
    };
  }

  const sameFactory = request.site_id === previousState.site_id;

  if (isEntry) {
    return {
      allowed: false,
      reason: `Anti-passback blocked: employee must exit site ${previousState.site_id} before any new entry`,
    };
  }

  if (!sameFactory) {
    return {
      allowed: false,
      reason: `Anti-passback blocked: employee must exit the same site they entered (${previousState.site_id})`,
    };
  }

  return {
    allowed: true,
    reason: "Access granted",
  };
}

export async function evaluateAccessRequest(payload) {
  const request = parseAccessRequest(payload);
  const previous = await getLastAccessState(request.employee_id);
  const decision = evaluateAntiPassback(request, previous.state);
  if (decision.allowed) {
    if (request.direction === "in") {
      await rememberAccessState(request.employee_id, {
        direction: "in",
        access_point_id: request.access_point_id,
        site_id: request.site_id,
      });
    } else {
      await clearLastAccessState(request.employee_id);
    }
  }

  const result = {
    result: decision.allowed,
    reason: decision.reason,
    employee_id: request.employee_id,
    access_point_id: request.access_point_id,
    site_id: request.site_id,
    direction: request.direction,
    processedAt: new Date().toISOString(),
  };

  const event = createAccessCheckedEvent(request, result);
  await sendAccessEvent(event);

  return {
    ...result,
    eventId: event.eventId,
  };
}
