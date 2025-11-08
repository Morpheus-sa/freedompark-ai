/**
 * Generates a human-readable 8-character meeting code
 * Format: XXXX-XXXX (e.g., "ABCD-1234")
 */
export function generateMeetingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed ambiguous characters (I, O, 0, 1)
  const segments = 2
  const segmentLength = 4

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
  }).join("-")

  return code
}

/**
 * Validates meeting code format
 */
export function isValidMeetingCode(code: string): boolean {
  // Format: XXXX-XXXX (8 chars + 1 hyphen)
  const codeRegex = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/
  return codeRegex.test(code.toUpperCase())
}

/**
 * Formats code for display (adds hyphen if missing)
 */
export function formatMeetingCode(code: string): string {
  const cleaned = code.replace(/[^A-Z0-9]/gi, "").toUpperCase()
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
  }
  return code.toUpperCase()
}
