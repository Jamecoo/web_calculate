import { formatLaoKipWithCurrency } from "./formatLaoKip";

// Payment reminders. Marking somebody as paid is manual, so the trip owner
// needs a way to nudge people — this builds the message and hands it to the
// phone's own share sheet (Messenger, WhatsApp, SMS...), falling back to the
// clipboard on desktop browsers that have no Web Share API.

export interface ReminderInput {
  tripName?: string;
  from: string; // person who owes
  to: string; // person who should receive
  amount: number;
  link?: string;
}

export type ReminderOutcome = "shared" | "copied" | "cancelled" | "failed";

export const buildReminderMessage = ({
  tripName,
  from,
  to,
  amount,
  link,
}: ReminderInput): string => {
  const lines = [
    `ສະບາຍດີ ${from} 👋`,
    `ຢ່າລືມໂອນເງິນ ${formatLaoKipWithCurrency(amount)} ໃຫ້ ${to} ເດີ້`,
  ];
  if (tripName?.trim()) lines.push(`ທຣິບ: ${tripName.trim()}`);
  if (link) lines.push(`ເບິ່ງລາຍລະອຽດ: ${link}`);
  lines.push("— ສົ່ງຈາກ Splitzy");
  return lines.join("\n");
};

export const shareReminder = async (
  message: string
): Promise<ReminderOutcome> => {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text: message });
      return "shared";
    } catch (err) {
      // The user dismissing the share sheet is not an error worth reporting.
      if ((err as Error)?.name === "AbortError") return "cancelled";
      console.error("Error sharing reminder:", err);
    }
  }

  try {
    await navigator.clipboard.writeText(message);
    return "copied";
  } catch (err) {
    console.error("Error copying reminder:", err);
    return "failed";
  }
};
