import { prisma } from "@repo/db/client";
import {
  deleteAccessEvent,
  parseAccessEvent,
  receiveAccessEvents,
  verifyQueueConnection,
} from "@repo/queue";

let shuttingDown = false;

process.on("SIGTERM", () => {
  shuttingDown = true;
});

process.on("SIGINT", () => {
  shuttingDown = true;
});

async function persistAccessEvent(event) {
  const accessLogData = {
    logId: BigInt(Date.now()),
    employeeId: BigInt(event.employee_id),
    siteId: BigInt(event.site_id),
    accessPointId: BigInt(event.access_point_id),
    direction: event.direction === "in" ? "In" : "Out",
    result: event.result ? "Accept" : "Deny",
    status: event.result ? null : false,
    reason: event.reason,
    eventTime: new Date(event.occurredAt),
    note: `Queue event ${event.eventId}`,
    createdAt: new Date(),
  };

  console.log("worker received event", event);
  console.log("worker writing accessLog", {
    ...accessLogData,
    logId: accessLogData.logId.toString(),
  });

  await prisma.accessLog.create({
    data: accessLogData,
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyStartupConnections() {
  await prisma.$queryRawUnsafe("SELECT 1");
  console.log("worker connected to db", {
    databaseUrl: process.env.DATABASE_URL,
  });

  const queue = await verifyQueueConnection();
  console.log("worker connected to queue", queue);
}

async function loop() {
  await verifyStartupConnections();

  while (!shuttingDown) {
    let messages = [];

    try {
      messages = await receiveAccessEvents(10);
    } catch (error) {
      console.error("failed to receive messages", { error });
      await sleep(5000);
      continue;
    }

    for (const message of messages) {
      if (!message.Body || !message.ReceiptHandle) {
        continue;
      }

      try {
        const event = parseAccessEvent(message.Body);
        await persistAccessEvent(event);
        await deleteAccessEvent(message.ReceiptHandle);

        console.log("processed message", {
          messageId: message.MessageId,
          eventId: event.eventId,
        });
      } catch (error) {
        console.error("failed to process message", {
          messageId: message.MessageId,
          receiveCount: message.Attributes?.ApproximateReceiveCount,
          error,
        });
      }
    }
  }

  await prisma.$disconnect();
}

await loop();
