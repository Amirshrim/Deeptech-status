import type { Metadata } from "next";
import { AdminHeader } from "@/components/AdminHeader";
import { requireAdminPage } from "@/lib/auth";
import { listEvents, listFeedback } from "@/lib/events";
import { FeedbackDashboard } from "./FeedbackDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Deep-Tech Admin — משוב",
  robots: { index: false, follow: false },
};

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const session = await requireAdminPage();
  const { event: requested } = await searchParams;

  const events = await listEvents();
  const selected =
    events.find((e) => e.id === requested) ?? events.find((e) => e.isActive) ?? events[0] ?? null;
  const items = selected ? await listFeedback(selected.id) : [];

  return (
    <>
      <AdminHeader email={session.email} current="feedback" />
      <main className="dt-page">
        <FeedbackDashboard events={events} selectedId={selected?.id ?? null} items={items} />
      </main>
    </>
  );
}
