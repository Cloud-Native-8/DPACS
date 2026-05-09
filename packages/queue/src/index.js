import {
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { randomUUID } from "node:crypto";

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function normalizeString(value, fieldName) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be boolean`);
  }

  return value;
}

export function parseAccessRequest(payload = {}) {
  return {
    userId: normalizeString(payload.userId, "userId"),
    doorId: normalizeString(payload.doorId, "doorId"),
    factoryId: normalizeString(payload.factoryId, "factoryId"),
    in: normalizeBoolean(payload.in, "in"),
  };
}

export function createAccessCheckedEvent(request, result) {
  return {
    eventId: randomUUID(),
    eventType: "access.checked",
    occurredAt: result.processedAt,
    userId: request.userId,
    doorId: request.doorId,
    factoryId: request.factoryId,
    in: request.in,
    pass: result.pass,
    reason: result.reason,
  };
}

export function parseAccessEvent(body) {
  const event = typeof body === "string" ? JSON.parse(body) : body;

  return {
    eventId: normalizeString(event.eventId, "eventId"),
    eventType: normalizeString(event.eventType, "eventType"),
    occurredAt: normalizeString(event.occurredAt, "occurredAt"),
    userId: normalizeString(event.userId, "userId"),
    doorId: normalizeString(event.doorId, "doorId"),
    factoryId: normalizeString(event.factoryId, "factoryId"),
    in: normalizeBoolean(event.in, "in"),
    pass: normalizeBoolean(event.pass, "pass"),
    reason: normalizeString(event.reason, "reason"),
  };
}

export function createSqsClient() {
  const endpoint = process.env.SQS_ENDPOINT || undefined;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

  return new SQSClient({
    region: required("AWS_REGION"),
    endpoint,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : endpoint
          ? {
              accessKeyId: "test",
              secretAccessKey: "test",
            }
          : undefined,
  });
}

let sqsClient;

function getSqsClient() {
  if (!sqsClient) {
    sqsClient = createSqsClient();
  }

  return sqsClient;
}

export async function sendAccessEvent(event) {
  await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: required("SQS_QUEUE_URL"),
      MessageBody: JSON.stringify(parseAccessEvent(event)),
    }),
  );
}

export async function receiveAccessEvents(maxMessages = 10) {
  const result = await getSqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: required("SQS_QUEUE_URL"),
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 60,
      AttributeNames: ["ApproximateReceiveCount", "SentTimestamp"],
    }),
  );

  return result.Messages || [];
}

export async function deleteAccessEvent(receiptHandle) {
  await getSqsClient().send(
    new DeleteMessageCommand({
      QueueUrl: required("SQS_QUEUE_URL"),
      ReceiptHandle: receiptHandle,
    }),
  );
}

export async function verifyQueueConnection() {
  const queueUrl = required("SQS_QUEUE_URL");

  const result = await getSqsClient().send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["QueueArn"],
    }),
  );

  return {
    queueUrl,
    queueArn: result.Attributes?.QueueArn || "",
  };
}
