import { prisma } from "@repo/db/client";
import {
  AccessEventValidationError,
  deleteAccessEvent,
  parseAccessEvent,
  receiveAccessEvents,
  verifyQueueConnection,
} from "@repo/queue";

let shuttingDown = false;

const BATCH_SIZE = 10;
const RETRY_SLEEP_MS = 5000;

process.on("SIGTERM", () => {
  console.log("worker received SIGTERM");
  shuttingDown = true;
});

process.on("SIGINT", () => {
  console.log("worker received SIGINT");
  shuttingDown = true;
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateLogId() {
  return (
    BigInt(Date.now()) * 1_000_000n +
    BigInt(Math.floor(Math.random() * 1_000_000))
  );
}

function toBigIntId(value, fieldName) {
  try {
    return BigInt(value);
  } catch {
    throw new AccessEventValidationError(
      `${fieldName} must be convertible to bigint`,
    );
  }
}

function toDbDirection(value) {
  if (value === "in") {
    return "In";
  }

  if (value === "out") {
    return "Out";
  }

  throw new AccessEventValidationError("direction must be either in or out");
}

function toDbResult(value) {
  if (typeof value !== "boolean") {
    throw new AccessEventValidationError("result must be boolean");
  }

  return value ? "Accept" : "Deny";
}

function toEventTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AccessEventValidationError("occurredAt must be a valid datetime");
  }

  return date;
}

function isNonRetryableMessageError(error) {
  return error instanceof AccessEventValidationError;
}

async function verifyStartupConnections() {
  while (!shuttingDown) {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      console.log("worker connected to db");

      const queue = await verifyQueueConnection();
      console.log("worker connected to queue", queue);

      return;
    } catch (error) {
      console.error("worker startup dependency check failed; retrying", {
        error,
      });

      await sleep(RETRY_SLEEP_MS);
    }
  }
}

async function persistAccessEvent(event) {
  const accessLogData = {
    logId: generateLogId(),
    employeeId: toBigIntId(event.employee_id, "employee_id"),
    siteId: toBigIntId(event.site_id, "site_id"),
    accessPointId: toBigIntId(event.access_point_id, "access_point_id"),
    direction: toDbDirection(event.direction),
    result: toDbResult(event.result),
    status: event.result ? null : false,
    reason: event.result ? null : event.reason,
    eventTime: toEventTime(event.occurredAt),
    note: `Queue event ${event.eventId}`,
    createdAt: new Date(),
  };

  console.log("worker writing accessLog", {
    ...accessLogData,
    logId: accessLogData.logId.toString(),
    employeeId: accessLogData.employeeId.toString(),
    siteId: accessLogData.siteId.toString(),
    accessPointId: accessLogData.accessPointId.toString(),
  });

  await prisma.accessLog.create({
    data: accessLogData,
  });
}

async function processMessage(message) {
  if (!message.Body || !message.ReceiptHandle) {
    throw new AccessEventValidationError(
      "SQS message must have Body and ReceiptHandle",
    );
  }

  const event = parseAccessEvent(message.Body);

  await persistAccessEvent(event);

  await deleteAccessEvent(message.ReceiptHandle);

  console.log("processed message", {
    messageId: message.MessageId,
    eventId: event.eventId,
  });
}

async function loop() {
  await verifyStartupConnections();

  while (!shuttingDown) {
    let messages = [];

    try {
      messages = await receiveAccessEvents(BATCH_SIZE);
    } catch (error) {
      console.error("failed to receive messages; retrying", { error });
      await sleep(RETRY_SLEEP_MS);
      continue;
    }

    for (const message of messages) {
      if (shuttingDown) {
        break;
      }

      try {
        await processMessage(message);
      } catch (error) {
        if (isNonRetryableMessageError(error)) {
          console.error("invalid message; leaving it for SQS DLQ redrive", {
            messageId: message.MessageId,
            receiveCount: message.Attributes?.ApproximateReceiveCount,
            error: formatError(error),
          });

          // 不 delete。
          // 讓 SQS 根據 RedrivePolicy 的 maxReceiveCount 自動送進 DLQ。
          continue;
        }

        console.error("failed to process message; leaving it for retry", {
          messageId: message.MessageId,
          receiveCount: message.Attributes?.ApproximateReceiveCount,
          error: formatError(error),
        });

        // 不 delete。
        // DB timeout / DB down / delete failed 等狀況讓 SQS visibility timeout 後重送。
      }
    }
  }

  await prisma.$disconnect();
  console.log("worker stopped");
}

function formatError(error) {
  return {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    statusCode: error?.statusCode,
  };
}

try {
  await loop();
} catch (error) {
  console.error("worker fatal error", { error });

  try {
    await prisma.$disconnect();
  } catch (disconnectError) {
    console.error("failed to disconnect prisma", { error: disconnectError });
  }

  process.exitCode = 1;
}
