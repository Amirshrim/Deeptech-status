// zod schemas for meetup feedback ("שימור / שיפור") and admin event management.
import { z } from "zod";

export const RATING_LABELS = ["בחרו דירוג", "גרוע", "לא משהו", "בסדר", "טוב", "מעולה"] as const;
export const FEEDBACK_TEXT_MAX = 1000;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `עד ${max} תווים`)
    .nullish()
    .transform((v) => (v ? v : null));

/** 0 / null / undefined → no rating. */
const optionalRating = z.preprocess(
  (v) => (v === 0 || v === "" || v === undefined ? null : v),
  z.number().int().min(1).max(5).nullable(),
);

export const feedbackInputSchema = z.object({
  eventId: z.string().trim().min(1).max(64),
  lectureRating: z
    .number({ invalid_type_error: "נא לדרג את המרצה", required_error: "נא לדרג את המרצה" })
    .int()
    .min(1, "נא לדרג את המרצה")
    .max(5),
  lectureKeep: text(FEEDBACK_TEXT_MAX),
  lectureImprove: text(FEEDBACK_TEXT_MAX),
  foodRating: optionalRating,
  foodKeep: text(FEEDBACK_TEXT_MAX),
  foodImprove: text(FEEDBACK_TEXT_MAX),
  notes: text(2000),
  name: text(100), // empty = anonymous
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export const eventInputSchema = z.object({
  title: z.string().trim().min(2, "נא למלא שם להרצאה").max(150, "השם ארוך מדי"),
  speaker: text(120),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "נא לבחור תאריך")
    .transform((d) => new Date(`${d}T12:00:00Z`)),
  isActive: z.boolean().default(true),
});

/** PATCH: either open the event for feedback, or edit its details. */
export const eventPatchSchema = z.union([
  z.object({ isActive: z.literal(true) }).strict(),
  eventInputSchema.omit({ isActive: true }),
]);
