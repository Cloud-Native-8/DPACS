CREATE TABLE "employee_access_state" (
  "employee_id" bigint PRIMARY KEY,
  "site_id" bigint,
  "current_state" varchar(20) NOT NULL DEFAULT 'UNKNOWN',
  "last_log_id" bigint,
  "last_access_point_id" bigint,
  "last_direction" varchar(10),
  "last_event_time" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "employee_daily_attendance_summary" (
  "employee_id" bigint NOT NULL,
  "work_date" date NOT NULL,
  "first_in_time" timestamp,
  "last_out_time" timestamp,
  "working_minutes" integer NOT NULL DEFAULT 0,
  "overtime_minutes" integer NOT NULL DEFAULT 0,
  "denied_log_count" integer NOT NULL DEFAULT 0,
  "is_complete" boolean NOT NULL DEFAULT true,
  "calculated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("employee_id", "work_date")
);

CREATE TABLE "report_refresh_queue" (
  "employee_id" bigint NOT NULL,
  "work_date" date NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" timestamp,
  PRIMARY KEY ("employee_id", "work_date")
);

ALTER TABLE "employee_access_state" ADD FOREIGN KEY ("employee_id") REFERENCES "employee" ("employee_id") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "employee_access_state" ADD FOREIGN KEY ("site_id") REFERENCES "site" ("site_id") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "employee_access_state" ADD FOREIGN KEY ("last_log_id") REFERENCES "access_log" ("log_id") DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "employee_access_state" ADD FOREIGN KEY ("last_access_point_id") REFERENCES "access_point" ("access_point_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "employee_daily_attendance_summary" ADD FOREIGN KEY ("employee_id") REFERENCES "employee" ("employee_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "report_refresh_queue" ADD FOREIGN KEY ("employee_id") REFERENCES "employee" ("employee_id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "idx_access_log_employee_event_time" ON "access_log" ("employee_id", "event_time");
CREATE INDEX "idx_access_log_result_event_time" ON "access_log" ("result", "event_time" DESC);
CREATE INDEX "idx_access_log_site_event_time" ON "access_log" ("site_id", "event_time");
CREATE INDEX "idx_access_log_denied_status" ON "access_log" ("status", "event_time" DESC) WHERE "result" = 'Deny';

CREATE INDEX "idx_employee_access_state_site_state" ON "employee_access_state" ("site_id", "current_state");
CREATE INDEX "idx_employee_daily_summary_work_date" ON "employee_daily_attendance_summary" ("work_date");
CREATE INDEX "idx_report_refresh_queue_unprocessed" ON "report_refresh_queue" ("created_at") WHERE "processed_at" IS NULL;

CREATE OR REPLACE FUNCTION refresh_employee_daily_attendance_summary(
  p_employee_id bigint,
  p_work_date date
) RETURNS void AS $$
DECLARE
  v_first_in timestamp;
  v_last_out timestamp;
  v_working_minutes integer;
  v_overtime_minutes integer;
  v_denied_log_count integer;
  v_in_count integer;
  v_out_count integer;
BEGIN
  WITH accepted_in AS (
    SELECT
      "event_time",
      "log_id",
      lead("event_time") OVER (ORDER BY "event_time", "log_id") AS next_in_time,
      lead("log_id") OVER (ORDER BY "event_time", "log_id") AS next_in_log_id
    FROM "access_log"
    WHERE "employee_id" = p_employee_id
      AND "result" = 'Accept'
      AND lower("direction") = 'in'
      AND "event_time" >= p_work_date
      AND "event_time" < p_work_date + INTERVAL '1 day'
  ),
  paired AS (
    SELECT
      accepted_in."event_time" AS in_time,
      (
        SELECT out_log."event_time"
        FROM "access_log" out_log
        WHERE out_log."employee_id" = p_employee_id
          AND out_log."result" = 'Accept'
          AND lower(out_log."direction") = 'out'
          AND out_log."event_time" >= p_work_date
          AND out_log."event_time" < p_work_date + INTERVAL '1 day'
          AND (
            out_log."event_time" > accepted_in."event_time"
            OR (
              out_log."event_time" = accepted_in."event_time"
              AND out_log."log_id" > accepted_in."log_id"
            )
          )
          AND (
            accepted_in.next_in_time IS NULL
            OR out_log."event_time" < accepted_in.next_in_time
            OR (
              out_log."event_time" = accepted_in.next_in_time
              AND out_log."log_id" < accepted_in.next_in_log_id
            )
          )
        ORDER BY out_log."event_time", out_log."log_id"
        LIMIT 1
      ) AS out_time
    FROM accepted_in
  )
  SELECT
    min(in_time),
    max(out_time),
    COALESCE(
      sum(
        CASE
          WHEN out_time IS NOT NULL AND out_time > in_time
            THEN floor(extract(epoch FROM out_time - in_time) / 60)::integer
          ELSE 0
        END
      ),
      0
    )
  INTO v_first_in, v_last_out, v_working_minutes
  FROM paired;

  SELECT count(*) INTO v_in_count
  FROM "access_log"
  WHERE "employee_id" = p_employee_id
    AND "result" = 'Accept'
    AND lower("direction") = 'in'
    AND "event_time" >= p_work_date
    AND "event_time" < p_work_date + INTERVAL '1 day';

  SELECT count(*) INTO v_out_count
  FROM "access_log"
  WHERE "employee_id" = p_employee_id
    AND "result" = 'Accept'
    AND lower("direction") = 'out'
    AND "event_time" >= p_work_date
    AND "event_time" < p_work_date + INTERVAL '1 day';

  SELECT count(*) INTO v_denied_log_count
  FROM "access_log"
  WHERE "employee_id" = p_employee_id
    AND "result" = 'Deny'
    AND "event_time" >= p_work_date
    AND "event_time" < p_work_date + INTERVAL '1 day';

  v_overtime_minutes := GREATEST(v_working_minutes - 480, 0);

  INSERT INTO "employee_daily_attendance_summary" (
    "employee_id",
    "work_date",
    "first_in_time",
    "last_out_time",
    "working_minutes",
    "overtime_minutes",
    "denied_log_count",
    "is_complete",
    "calculated_at"
  ) VALUES (
    p_employee_id,
    p_work_date,
    v_first_in,
    v_last_out,
    v_working_minutes,
    v_overtime_minutes,
    v_denied_log_count,
    v_in_count = v_out_count,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("employee_id", "work_date") DO UPDATE SET
    "first_in_time" = EXCLUDED."first_in_time",
    "last_out_time" = EXCLUDED."last_out_time",
    "working_minutes" = EXCLUDED."working_minutes",
    "overtime_minutes" = EXCLUDED."overtime_minutes",
    "denied_log_count" = EXCLUDED."denied_log_count",
    "is_complete" = EXCLUDED."is_complete",
    "calculated_at" = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_report_refresh_queue(
  p_limit integer DEFAULT 500
) RETURNS integer AS $$
DECLARE
  v_row record;
  v_processed integer := 0;
BEGIN
  FOR v_row IN
    SELECT "employee_id", "work_date"
    FROM "report_refresh_queue"
    WHERE "processed_at" IS NULL
    ORDER BY "created_at"
    LIMIT p_limit
  LOOP
    PERFORM refresh_employee_daily_attendance_summary(v_row."employee_id", v_row."work_date");

    UPDATE "report_refresh_queue"
    SET "processed_at" = CURRENT_TIMESTAMP
    WHERE "employee_id" = v_row."employee_id"
      AND "work_date" = v_row."work_date";

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_access_log_report_summary() RETURNS trigger AS $$
BEGIN
  INSERT INTO "report_refresh_queue" ("employee_id", "work_date", "created_at", "processed_at")
  VALUES (NEW."employee_id", NEW."event_time"::date, CURRENT_TIMESTAMP, NULL)
  ON CONFLICT ("employee_id", "work_date") DO UPDATE SET
    "created_at" = LEAST("report_refresh_queue"."created_at", EXCLUDED."created_at"),
    "processed_at" = NULL;

  IF NEW."result" = 'Accept' THEN
    INSERT INTO "employee_access_state" (
      "employee_id",
      "site_id",
      "current_state",
      "last_log_id",
      "last_access_point_id",
      "last_direction",
      "last_event_time",
      "updated_at"
    ) VALUES (
      NEW."employee_id",
      NEW."site_id",
      CASE WHEN lower(NEW."direction") = 'in' THEN 'INSIDE' ELSE 'OUTSIDE' END,
      NEW."log_id",
      NEW."access_point_id",
      NEW."direction",
      NEW."event_time",
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("employee_id") DO UPDATE SET
      "site_id" = EXCLUDED."site_id",
      "current_state" = EXCLUDED."current_state",
      "last_log_id" = EXCLUDED."last_log_id",
      "last_access_point_id" = EXCLUDED."last_access_point_id",
      "last_direction" = EXCLUDED."last_direction",
      "last_event_time" = EXCLUDED."last_event_time",
      "updated_at" = CURRENT_TIMESTAMP
    WHERE "employee_access_state"."last_event_time" IS NULL
       OR EXCLUDED."last_event_time" >= "employee_access_state"."last_event_time";
  END IF;

  PERFORM refresh_employee_daily_attendance_summary(NEW."employee_id", NEW."event_time"::date);

  UPDATE "report_refresh_queue"
  SET "processed_at" = CURRENT_TIMESTAMP
  WHERE "employee_id" = NEW."employee_id"
    AND "work_date" = NEW."event_time"::date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_access_log_report_summary"
AFTER INSERT ON "access_log"
FOR EACH ROW
EXECUTE FUNCTION handle_access_log_report_summary();

INSERT INTO "employee_access_state" (
  "employee_id",
  "site_id",
  "current_state",
  "last_log_id",
  "last_access_point_id",
  "last_direction",
  "last_event_time",
  "updated_at"
)
SELECT DISTINCT ON ("employee_id")
  "employee_id",
  "site_id",
  CASE WHEN lower("direction") = 'in' THEN 'INSIDE' ELSE 'OUTSIDE' END,
  "log_id",
  "access_point_id",
  "direction",
  "event_time",
  CURRENT_TIMESTAMP
FROM "access_log"
WHERE "result" = 'Accept'
ORDER BY "employee_id", "event_time" DESC, "log_id" DESC
ON CONFLICT ("employee_id") DO UPDATE SET
  "site_id" = EXCLUDED."site_id",
  "current_state" = EXCLUDED."current_state",
  "last_log_id" = EXCLUDED."last_log_id",
  "last_access_point_id" = EXCLUDED."last_access_point_id",
  "last_direction" = EXCLUDED."last_direction",
  "last_event_time" = EXCLUDED."last_event_time",
  "updated_at" = CURRENT_TIMESTAMP;

DO $$
DECLARE
  v_row record;
BEGIN
  FOR v_row IN
    SELECT DISTINCT "employee_id", "event_time"::date AS work_date
    FROM "access_log"
  LOOP
    PERFORM refresh_employee_daily_attendance_summary(v_row."employee_id", v_row.work_date);
  END LOOP;
END;
$$;
