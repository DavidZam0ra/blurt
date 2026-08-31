/** Converts an ISO instant to the value a `<input type="datetime-local">` expects, in the browser's local timezone. */
export function toDateTimeLocalInputValue(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  const offsetInMinutes = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offsetInMinutes * 60000);
  return local.toISOString().slice(0, 16);
}
