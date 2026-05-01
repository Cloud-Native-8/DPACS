import { prisma } from "@repo/db/client";
import {
  deleteAccessEvent,
  parseAccessEvent,
  receiveAccessEvents
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
      eventId: event.eventId
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
      payload: event
    }
  });
}

async function loop() {
  while (!shuttingDown) {
    const messages = await receiveAccessEvents(10);

    for (const message of messages) {
      if (!message.Body || !message.ReceiptHandle) {
        continue;
      }

      try {
        const event = parseAccessEvent(message.Body);
        await persistAccessEvent(event);
        await deleteAccessEvent(message.ReceiptHandle);
      } catch (error) {
        console.error("failed to process message", {
          messageId: message.MessageId,
          error
        });
      }
    }
  }

  await prisma.$disconnect();
}

await loop();
