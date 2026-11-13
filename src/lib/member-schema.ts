// Shared zod schemas — used by the client form, the public API and the admin API.
import { z } from "zod";

export const ALLERGY_MAX = 500;
export const NOTES_MAX = 1000;

const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .nullish()
    .transform((v) => (v ? v : null));

/** Fields shared by the public form and the admin edit form. */
const memberFields = {
  fullName: z
    .string({ required_error: "נא למלא שם מלא" })
    .trim()
    .min(2, "נא למלא שם מלא")
    .max(100, "השם ארוך מדי"),
  email: z
    .string({ required_error: "נא למלא כתובת מייל" })
    .trim()
    .toLowerCase()
    .min(1, "נא למלא כתובת מייל")
    .max(200, "כתובת המייל ארוכה מדי")
    .email("כתובת המייל לא תקינה"),
  phone: z
    .string()
    .trim()
    .max(30, "מספר הטלפון ארוך מדי")
    .regex(/^[0-9+\-\s()]*$/, "מספר הטלפון יכול להכיל רק ספרות, רווחים, + ו-")
    .nullish()
    .transform((v) => (v ? v : null)),
  vegetarian: z.boolean().default(false),
  vegan: z.boolean().default(false),
  kosher: z.boolean().default(false),
  celiac: z.boolean().default(false),
  hasAllergy: z.boolean().default(false),
  allergyDetails: optionalText(ALLERGY_MAX, `עד ${ALLERGY_MAX} תווים`),
  allergySevere: z.boolean().default(false),
  notes: optionalText(NOTES_MAX, `עד ${NOTES_MAX} תווים`),
};

type RawMember = {
  vegetarian: boolean;
  vegan: boolean;
  hasAllergy: boolean;
  allergyDetails: string | null;
  allergySevere: boolean;
};

/** Allergy details are required only when the allergy toggle is on. */
function allergyRule(data: RawMember, ctx: z.RefinementCtx) {
  if (data.hasAllergy && !data.allergyDetails) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["allergyDetails"],
      message: "נא לפרט את האלרגיות",
    });
  }
}

/** Business rules applied after validation (on client and server alike). */
function normalize<T extends RawMember>(data: T): T {
  return {
    ...data,
    // Vegan implies vegetarian.
    vegetarian: data.vegetarian || data.vegan,
    // Drop allergy details when the toggle is off.
    allergyDetails: data.hasAllergy ? data.allergyDetails : null,
    allergySevere: data.hasAllergy && data.allergySevere,
  };
}

/** Public form submission. */
export const memberInputSchema = z
  .object({
    ...memberFields,
    consent: z.literal(true, {
      errorMap: () => ({ message: "יש לאשר את השימוש במידע כדי לשלוח" }),
    }),
  })
  .superRefine(allergyRule)
  .transform(normalize);

/** Admin edit (no consent checkbox — consent was given at submission). */
export const adminMemberSchema = z
  .object(memberFields)
  .superRefine(allergyRule)
  .transform(normalize);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200).email(),
  password: z.string().min(1).max(200),
});

export type MemberInput = z.infer<typeof memberInputSchema>;
export type AdminMemberInput = z.infer<typeof adminMemberSchema>;

/** Flattens zod errors to { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
