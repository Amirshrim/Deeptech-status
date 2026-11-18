// Server-side reads for the lecture sign-up board.
import "server-only";
import { prisma } from "./db";
import { dateKeyToDate, dateToKey, upcomingTuesdays, type AdminSlot, type PublicSlot } from "./lectures";

async function slotsFor(dates: string[]) {
  const rows = await prisma.lectureSlot.findMany({
    where: { date: { in: dates.map(dateKeyToDate) } },
  });
  return new Map(rows.map((r) => [dateToKey(r.date), r]));
}

export async function getPublicBoard(now: Date = new Date()): Promise<PublicSlot[]> {
  const dates = upcomingTuesdays(now);
  const byDate = await slotsFor(dates);
  return dates.map((date) => {
    const r = byDate.get(date);
    if (!r) return { date, status: "free", name: null, topic: null };
    if (r.blocked) return { date, status: "blocked", name: null, topic: null };
    return { date, status: "taken", name: r.name, topic: r.topic };
  });
}

export async function getAdminBoard(now: Date = new Date()): Promise<AdminSlot[]> {
  const dates = upcomingTuesdays(now);
  const byDate = await slotsFor(dates);
  return dates.map((date) => {
    const r = byDate.get(date);
    if (!r) return { date, status: "free", name: null, topic: null, email: null, claimedAt: null };
    return {
      date,
      status: r.blocked ? "blocked" : "taken",
      name: r.name,
      topic: r.topic,
      email: r.email,
      claimedAt: r.blocked ? null : r.createdAt.toISOString(),
    };
  });
}
