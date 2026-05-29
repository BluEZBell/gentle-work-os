// Mock document numbering helpers.
const counters: Record<string, number> = {};
const YEAR = "2026";

const seed = (prefix: string, start: number) => {
  if (counters[prefix] == null) counters[prefix] = start;
};
seed("CUS", 100); seed("DEAL", 50); seed("QT", 60); seed("JOB", 30);
seed("PO", 30); seed("BILL", 20); seed("INV", 50); seed("SRV", 10);
seed("TASK", 20); seed("CO", 10);

const yeared = new Set(["QT", "JOB", "PO", "BILL", "INV", "SRV", "CO"]);
const pad4 = (n: number) => String(n).padStart(4, "0");
const pad3 = (n: number) => String(n).padStart(3, "0");

export const nextNumber = (prefix: string): string => {
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  return yeared.has(prefix)
    ? `${prefix}-${YEAR}-${pad4(counters[prefix])}`
    : `${prefix}-${pad4(counters[prefix])}`;
};

export const peekNumber = (prefix: string): string => {
  const n = (counters[prefix] ?? 0) + 1;
  return yeared.has(prefix) ? `${prefix}-${YEAR}-${pad4(n)}` : `${prefix}-${pad4(n)}`;
};

export const sampleSeries = (prefix: string) =>
  yeared.has(prefix) ? `${prefix}-${YEAR}-${pad4(1)}` : `${prefix}-${pad3(1)}`;
