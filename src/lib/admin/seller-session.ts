/**
 * Sesiones de venta POS · CART-3.
 *
 * Estado 100 % local (localStorage). No toca quotes/quote_items ni el carrito público.
 */

export type PosCartLine = {
  productId: string;
  name: string;
  brandName: string | null;
  price: number;
  image: string | null;
  quantity: number;
};

export type PosSaleSession = {
  /** Número secuencial visual (Venta #001). */
  number: number;
  startedAt: string;
  lines: PosCartLine[];
};

export type PosSaleHistoryEntry = {
  id: number;
  date: string;
  total: number;
  /** Cantidad de líneas (productos distintos). */
  productCount: number;
};

const COUNTER_KEY = "shalko:pos:counter";
const ACTIVE_KEY = "shalko:pos:active";
const HISTORY_KEY = "shalko:pos:history";
const MAX_HISTORY = 10;

function readCounter(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 1;
  } catch {
    return 1;
  }
}

function writeCounter(n: number) {
  try {
    localStorage.setItem(COUNTER_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function formatSaleLabel(number: number): string {
  return `Venta #${String(number).padStart(3, "0")}`;
}

export function formatSaleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function lineSubtotal(line: PosCartLine): number {
  return line.price * line.quantity;
}

export function sessionTotal(lines: PosCartLine[]): number {
  return lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
}

export function loadActiveSession(): PosSaleSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PosSaleSession;
    if (!parsed || typeof parsed.number !== "number" || !Array.isArray(parsed.lines)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: PosSaleSession) {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function loadSaleHistory(): PosSaleHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PosSaleHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSaleHistory(entries: PosSaleHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    /* ignore */
  }
}

/** Nueva sesión vacía; incrementa el contador global. */
export function createSaleSession(): PosSaleSession {
  const number = readCounter();
  writeCounter(number + 1);
  const session: PosSaleSession = {
    number,
    startedAt: new Date().toISOString(),
    lines: [],
  };
  saveActiveSession(session);
  return session;
}

/** Restaura sesión activa o crea una nueva si no existe. */
export function initSaleSession(): PosSaleSession {
  const existing = loadActiveSession();
  if (existing) return existing;
  return createSaleSession();
}

export function archiveSaleToHistory(session: PosSaleSession): PosSaleHistoryEntry | null {
  if (!session.lines.length) return null;
  const entry: PosSaleHistoryEntry = {
    id: session.number,
    date: new Date().toISOString(),
    total: sessionTotal(session.lines),
    productCount: session.lines.length,
  };
  const history = [entry, ...loadSaleHistory()].slice(0, MAX_HISTORY);
  saveSaleHistory(history);
  return entry;
}

export function clearActiveSessionStorage() {
  try {
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}
