// Emails granted the Admin role. Admins can see every user's data;
// everyone else is a regular User who sees only their own.
// Keep this in sync with the admin list in firestore.rules.
export const ADMIN_EMAILS: string[] = [
  'thadsaphone9977@gmail.com',
]

export const isAdminEmail = (email?: string | null): boolean =>
  !!email && ADMIN_EMAILS.includes(email)
