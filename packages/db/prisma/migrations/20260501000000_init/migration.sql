-- CreateTable
CREATE TABLE "access_events" (
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "door_id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "in" BOOLEAN NOT NULL,
    "pass" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "access_events_user_id_occurred_at_idx" ON "access_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "access_events_factory_id_occurred_at_idx" ON "access_events"("factory_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "access_events_occurred_at_idx" ON "access_events"("occurred_at" DESC);
