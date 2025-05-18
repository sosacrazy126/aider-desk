/**
 * Analytics/telemetry stub.
 * Replace with real analytics provider as needed.
 */
export function track(event: string, props: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log('[Track event]', event, props);
}