// Base URL of this CRM frontend — read from .env so it works locally and on prod
// Local:  VITE_APP_URL=http://localhost:3100
// Prod:   VITE_APP_URL=https://crm.ifluent.io
export const APP_URL: string =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ??
  window.location.origin;

/** Full public invoice URL from a /pay/:uuid path */
export const invoiceFullUrl = (invoicePath: string): string =>
  `${APP_URL}${invoicePath}`;
