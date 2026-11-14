// Aggregation and CSV for feedback (pure functions — no DB access).
import { csvCell } from "./csv";
import { formatDate, formatDateTime } from "./format";

export type EventDTO = {
  id: string;
  title: string;
  speaker: string | null;
  date: string;
  isActive: boolean;
  feedbackCount: number;
};

export type FeedbackDTO = {
  id: string;
  lectureRating: number;
  lectureKeep: string | null;
  lectureImprove: string | null;
  foodRating: number | null;
  foodKeep: string | null;
  foodImprove: string | null;
  notes: string | null;
  name: string | null;
  createdAt: string;
};

export type FeedbackStats = {
  count: number;
  anonymous: number;
  lectureAvg: number | null;
  foodAvg: number | null;
  foodCount: number;
  lectureDistribution: number[]; // index 0..4 → ★1..★5
};

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function computeFeedbackStats(items: FeedbackDTO[]): FeedbackStats {
  const food = items.map((i) => i.foodRating).filter((r): r is number => r !== null);
  const dist = [0, 0, 0, 0, 0];
  for (const i of items) if (i.lectureRating >= 1 && i.lectureRating <= 5) dist[i.lectureRating - 1]++;
  return {
    count: items.length,
    anonymous: items.filter((i) => !i.name).length,
    lectureAvg: avg(items.map((i) => i.lectureRating)),
    foodAvg: avg(food),
    foodCount: food.length,
    lectureDistribution: dist,
  };
}

export type Comment = { id: string; text: string; who: string; rating: number | null };

/** Non-empty comments of one field, newest first. */
export function commentsOf(
  items: FeedbackDTO[],
  field: "lectureKeep" | "lectureImprove" | "foodKeep" | "foodImprove" | "notes",
): Comment[] {
  const ratingField = field.startsWith("lecture") ? "lectureRating" : field.startsWith("food") ? "foodRating" : null;
  return items
    .filter((i) => i[field])
    .map((i) => ({
      id: i.id,
      text: i[field] as string,
      who: i.name ?? "עילום שם",
      rating: ratingField ? (i[ratingField] as number | null) : null,
    }));
}

export function buildFeedbackCsv(event: Pick<EventDTO, "title" | "speaker" | "date">, items: FeedbackDTO[]): string {
  const headers = [
    "הרצאה",
    "מרצה",
    "תאריך מפגש",
    "דירוג מרצה",
    "מרצה – שימור",
    "מרצה – שיפור",
    "דירוג אוכל",
    "אוכל – שימור",
    "אוכל – שיפור",
    "הערות",
    "שם",
    "נשלח",
  ];
  const rows = [headers.map(csvCell).join(",")];
  for (const i of items) {
    rows.push(
      [
        csvCell(event.title),
        csvCell(event.speaker),
        csvCell(formatDate(event.date)),
        csvCell(i.lectureRating),
        csvCell(i.lectureKeep),
        csvCell(i.lectureImprove),
        csvCell(i.foodRating),
        csvCell(i.foodKeep),
        csvCell(i.foodImprove),
        csvCell(i.notes),
        csvCell(i.name ?? "עילום שם"),
        csvCell(formatDateTime(i.createdAt)),
      ].join(","),
    );
  }
  return "﻿" + rows.join("\r\n") + "\r\n";
}
