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


--
CREATE TABLE "department" (
  "department_id" bigint PRIMARY KEY,
  "department_name" varchar(100) NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "department_hierarchy" (
  "ancestor_department_id" bigint NOT NULL,
  "descendant_department_id" bigint NOT NULL,
  "depth" integer NOT NULL,
  PRIMARY KEY ("ancestor_department_id", "descendant_department_id")
);

CREATE TABLE "employee" (
  "employee_id" bigint PRIMARY KEY,
  "employee_name" varchar(100) NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "phone" varchar(15),
  "job_title" varchar(100),
  "department_id" bigint NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "site" (
  "site_id" bigint PRIMARY KEY,
  "site_name" varchar(100) NOT NULL,
  "site_address" text NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "access_point" (
  "access_point_id" bigint PRIMARY KEY,
  "access_point_name" varchar(100) NOT NULL,
  "site_id" bigint NOT NULL,
  "location_description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "employee_site_access" (
  "employee_id" bigint NOT NULL,
  "site_id" bigint NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "granted_at" timestamp,
  "expired_at" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp,
  PRIMARY KEY ("employee_id", "site_id")
);

CREATE TABLE "access_log" (
  "log_id" bigint PRIMARY KEY,
  "employee_id" bigint NOT NULL,
  "site_id" bigint NOT NULL,
  "access_point_id" bigint NOT NULL,
  "direction" varchar(10) NOT NULL,
  "result" varchar(10) NOT NULL,
  "reason" text,
  "event_time" timestamp NOT NULL,
  "note" text,
  "created_at" timestamp
);

COMMENT ON COLUMN "department_hierarchy"."depth" IS '0 = itself, 1 = direct child, 2+ = indirect child';

COMMENT ON COLUMN "access_log"."direction" IS 'Allowed values: In, Out';

COMMENT ON COLUMN "access_log"."result" IS 'Allowed values: Accept, Deny';

ALTER TABLE "department_hierarchy" ADD FOREIGN KEY ("ancestor_department_id") REFERENCES "department" ("department_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "department_hierarchy" ADD FOREIGN KEY ("descendant_department_id") REFERENCES "department" ("department_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "employee" ADD FOREIGN KEY ("department_id") REFERENCES "department" ("department_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "access_point" ADD FOREIGN KEY ("site_id") REFERENCES "site" ("site_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "employee_site_access" ADD FOREIGN KEY ("employee_id") REFERENCES "employee" ("employee_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "employee_site_access" ADD FOREIGN KEY ("site_id") REFERENCES "site" ("site_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "access_log" ADD FOREIGN KEY ("employee_id") REFERENCES "employee" ("employee_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "access_log" ADD FOREIGN KEY ("site_id") REFERENCES "site" ("site_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "access_log" ADD FOREIGN KEY ("access_point_id") REFERENCES "access_point" ("access_point_id") DEFERRABLE INITIALLY IMMEDIATE;