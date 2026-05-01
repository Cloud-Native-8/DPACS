#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-ap-northeast-1}"
SERVICE_NAME="localstack"

DLQ_URL=$(docker compose exec -T "$SERVICE_NAME" awslocal sqs create-queue \
  --region "$REGION" \
  --queue-name access-events-dlq \
  --attributes MessageRetentionPeriod=1209600 \
  --query "QueueUrl" \
  --output text)

DLQ_ARN=$(docker compose exec -T "$SERVICE_NAME" awslocal sqs get-queue-attributes \
  --region "$REGION" \
  --queue-url "$DLQ_URL" \
  --attribute-names QueueArn \
  --query "Attributes.QueueArn" \
  --output text)

QUEUE_URL=$(docker compose exec -T "$SERVICE_NAME" awslocal sqs create-queue \
  --region "$REGION" \
  --queue-name access-events \
  --attributes ReceiveMessageWaitTimeSeconds=20,VisibilityTimeout=60 \
  --query "QueueUrl" \
  --output text)

REDRIVE_POLICY=$(printf '{"deadLetterTargetArn":"%s","maxReceiveCount":"5"}' "$DLQ_ARN")
ATTRIBUTES_JSON=$(printf '{"RedrivePolicy":"%s"}' "${REDRIVE_POLICY//\"/\\\"}")

docker compose exec -T "$SERVICE_NAME" awslocal sqs set-queue-attributes \
  --region "$REGION" \
  --queue-url "$QUEUE_URL" \
  --attributes "$ATTRIBUTES_JSON"

echo "queue setup complete"
