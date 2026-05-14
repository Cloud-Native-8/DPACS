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

function normalizeDirection(value, fieldName) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!["in", "out"].includes(normalized)) {
    throw new Error(`${fieldName} must be either in or out`);
  }

  return normalized;
}

export function parseAccessRequest(payload = {}) {
  return {
    employee_id: normalizeString(payload.employee_id, "employee_id"),
    access_point_id: normalizeString(payload.access_point_id, "access_point_id"),
    site_id: normalizeString(payload.site_id, "site_id"),
    direction: normalizeDirection(payload.direction, "direction"),
  };
}

export function createAccessCheckedEvent(request, result) {
  return {
    eventId: randomUUID(),
    eventType: "access.checked",
    occurredAt: result.processedAt,
    employee_id: request.employee_id,
    access_point_id: request.access_point_id,
    site_id: request.site_id,
    direction: request.direction,
    result: result.result,
    reason: result.reason,
  };
}

export function parseAccessEvent(body) {
  const event = typeof body === "string" ? JSON.parse(body) : body;

  return {
    eventId: normalizeString(event.eventId, "eventId"),
    eventType: normalizeString(event.eventType, "eventType"),
    occurredAt: normalizeString(event.occurredAt, "occurredAt"),
    employee_id: normalizeString(event.employee_id, "employee_id"),
    access_point_id: normalizeString(event.access_point_id, "access_point_id"),
    site_id: normalizeString(event.site_id, "site_id"),
    direction: normalizeDirection(event.direction, "direction"),
    result: normalizeBoolean(event.result, "result"),
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
  console.log("access checked event", event);
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
