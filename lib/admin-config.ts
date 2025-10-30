export const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_1 || "admin1@example.com",
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_2 || "admin2@example.com",
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
