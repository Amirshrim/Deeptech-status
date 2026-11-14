-- Data migration: open feedback for the club meetup on Tuesday 17.11.2026.
-- Runs once. Title/speaker can be edited later from /admin/feedback.
UPDATE "ClubEvent" SET "isActive" = false WHERE "isActive" = true;

INSERT INTO "ClubEvent" ("id", "title", "speaker", "date", "isActive", "createdAt")
VALUES ('ev_20261117', 'מפגש המועדון של יום שלישי', NULL, '2026-11-17 12:00:00', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
