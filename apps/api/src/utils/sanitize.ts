/**
 * Previne CSV Injection — prefixos perigosos (=, +, -, @, tab, CR) são escapados
 * conforme OWASP: https://owasp.org/www-community/attacks/CSV_Injection
 */
export function sanitizeCsvField(value: string): string {
  const dangerous = /^[=+\-@\t\r]/;
  const sanitized = dangerous.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/**
 * Escapa entidades XML para prevenir XML/XSS Injection em exports SpreadsheetML
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
