// These email addresses have full admin privileges and can manage other users
const HARDCODED_ADMIN_EMAILS = [
  "sibusiso.mzimba@dumapuretechnologies.co.za",
  "name@example.com", // Replace with your second admin email
];

// Admin emails that can create meetings
export const ADMIN_EMAILS = HARDCODED_ADMIN_EMAILS.map((email) =>
  email.toLowerCase()
);

// Super admin emails that can promote/demote other users to admin
export const SUPER_ADMIN_EMAILS = HARDCODED_ADMIN_EMAILS.map((email) =>
  email.toLowerCase()
);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function isSuperAdmin(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

console.log(" Admin Config - ADMIN_EMAILS:", ADMIN_EMAILS);
console.log(" Admin Config - SUPER_ADMIN_EMAILS:", SUPER_ADMIN_EMAILS);
