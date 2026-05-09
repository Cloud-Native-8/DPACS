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
  await prisma.accessEvent.upsert({
    where: {
      eventId: event.eventId,
    },
    update: {},
    create: {
      eventId: event.eventId,
      userId: event.userId,
      doorId: event.doorId,
      factoryId: event.factoryId,
      in: event.in,
      pass: event.pass,
      reason: event.reason,
      occurredAt: new Date(event.occurredAt),
      payload: event,
    },
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
