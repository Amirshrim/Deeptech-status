"use client";

import { useEffect, useState } from "react";
import { readSavedDiet } from "@/lib/saved-diet";

/** "✓ מילאת" on the menu's diet card when this device already filled the form. */
export function DietSavedBadge() {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(readSavedDiet() !== null), []);
  if (!saved) return null;
  return <span className="dt-badge dt-badge-good mt-1.5 self-start">✓ כבר מילאת · אפשר לעדכן</span>;
}
