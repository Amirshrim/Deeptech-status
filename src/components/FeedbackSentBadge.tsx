"use client";

import { useEffect, useState } from "react";
import { hasSentFeedback } from "@/lib/saved-diet";

/** "✓ שלחת משוב" on the menu's feedback card when this device already sent feedback for the active event. */
export function FeedbackSentBadge({ eventId }: { eventId: string }) {
  const [sent, setSent] = useState(false);
  useEffect(() => setSent(hasSentFeedback(eventId)), [eventId]);
  if (!sent) return null;
  return <span className="dt-badge dt-badge-good mt-1.5 self-start">✓ כבר שלחת משוב · אפשר להוסיף</span>;
}
