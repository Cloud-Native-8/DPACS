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

export function evaluateAntiPassback(request, previousState) {
  if (!previousState) {
    if (!request.in) {
      return {
        allowed: false,
        reason: "Anti-passback blocked: user is not marked inside any factory",
      };
    }

    return {
      allowed: true,
      reason: "Access granted",
    };
  }

  const sameFactory = request.factoryId === previousState.factoryId;

  if (request.in) {
    return {
      allowed: false,
      reason: `Anti-passback blocked: user must exit factory ${previousState.factoryId} before any new entry`,
    };
  }

  if (!sameFactory) {
    return {
      allowed: false,
      reason: `Anti-passback blocked: user must exit the same factory they entered (${previousState.factoryId})`,
    };
  }

  return {
    allowed: true,
    reason: "Access granted",
  };
}

export async function evaluateAccessRequest(payload) {
  const request = parseAccessRequest(payload);
  const previous = await getLastAccessState(request.userId);
  const decision = evaluateAntiPassback(request, previous.state);
  if (decision.allowed) {
    if (request.in) {
      await rememberAccessState(request.userId, {
        in: true,
        doorId: request.doorId,
        factoryId: request.factoryId,
      });
    } else {
      await clearLastAccessState(request.userId);
    }
  }

  const result = {
    pass: decision.allowed,
    reason: decision.reason,
    userId: request.userId,
    doorId: request.doorId,
    factoryId: request.factoryId,
    in: request.in,
    processedAt: new Date().toISOString(),
  };

  const event = createAccessCheckedEvent(request, result);
  await sendAccessEvent(event);

  return {
    ...result,
    eventId: event.eventId,
  };
}
