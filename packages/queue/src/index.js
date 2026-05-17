import {
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { randomUUID } from "node:crypto";

export class AccessEventValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AccessEventValidationError";
    this.statusCode = 400;
  }
}

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function normalizeString(value, fieldName) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new AccessEventValidationError(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new AccessEventValidationError(`${fieldName} must be boolean`);
  }

  return value;
}

function normalizeNumericId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);

  if (!/^\d+$/.test(normalized)) {
    throw new AccessEventValidationError(
      `${fieldName} must be a numeric string`,
    );
  }

  return normalized;
}

function normalizeDirection(value, fieldName) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "in") {
    return "in";
  }

  if (normalized === "out") {
    return "out";
  }

  throw new AccessEventValidationError(`${fieldName} must be either in or out`);
}

export function parseAccessRequest(payload = {}) {
  return {
    employee_id: normalizeNumericId(payload.employee_id, "employee_id"),
    access_point_id: normalizeNumericId(
      payload.access_point_id,
      "access_point_id",
    ),
    site_id: normalizeNumericId(payload.site_id, "site_id"),
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
  let event;

  try {
    event = typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    throw new AccessEventValidationError("event body must be valid JSON");
  }

  return {
    eventId: normalizeString(event.eventId, "eventId"),
    eventType: normalizeString(event.eventType, "eventType"),
    occurredAt: normalizeString(event.occurredAt, "occurredAt"),
    employee_id: normalizeNumericId(event.employee_id, "employee_id"),
    access_point_id: normalizeNumericId(
      event.access_point_id,
      "access_point_id",
    ),
    site_id: normalizeNumericId(event.site_id, "site_id"),
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
  const normalizedEvent = parseAccessEvent(event);

  console.log("access checked event", normalizedEvent);

  await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: required("SQS_QUEUE_URL"),
      MessageBody: JSON.stringify(normalizedEvent),
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
