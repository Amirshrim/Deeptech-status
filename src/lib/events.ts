// Server-side event helpers.
import "server-only";
import { prisma } from "./db";
import type { EventDTO, FeedbackDTO } from "./feedback-stats";

export type PublicEvent = { id: string; title: string; speaker: string | null; date: string };

/** The event the public feedback form attaches to (newest active one), or null. */
export async function getActiveEvent(): Promise<PublicEvent | null> {
  const e = await prisma.clubEvent.findFirst({
    where: { isActive: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true, speaker: true, date: true },
  });
  return e ? { ...e, date: e.date.toISOString() } : null;
}

export async function listEvents(): Promise<EventDTO[]> {
  const events = await prisma.clubEvent.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { feedback: true } } },
  });
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    speaker: e.speaker,
    date: e.date.toISOString(),
    isActive: e.isActive,
    feedbackCount: e._count.feedback,
  }));
}

export async function listFeedback(eventId: string): Promise<FeedbackDTO[]> {
  const rows = await prisma.feedback.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } });
  return rows.map((f) => ({
    id: f.id,
    lectureRating: f.lectureRating,
    lectureKeep: f.lectureKeep,
    lectureImprove: f.lectureImprove,
    foodRating: f.foodRating,
    foodKeep: f.foodKeep,
    foodImprove: f.foodImprove,
    notes: f.notes,
    name: f.name,
    createdAt: f.createdAt.toISOString(),
  }));
}
