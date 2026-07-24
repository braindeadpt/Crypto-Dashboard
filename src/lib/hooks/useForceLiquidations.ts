"use client";

import { useEffect, useRef, useState } from "react";

export type ForceLiqEvent = {
  id: string;
  symbol: "BTCUSDT" | "ETHUSDT" | "SOLUSDT";
  /** Liquidated side: long = SELL force order, short = BUY force order */
  side: "long" | "short";
  price: number;
  qty: number;
  notional: number;
  time: number;
};

export type ForceLiqConnection =
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

export type ForceLiqWindow = {
  connection: ForceLiqConnection;
  events: ForceLiqEvent[];
  longNotional: number;
  shortNotional: number;
  bias: "long" | "short" | "neutral";
  lastEventAt: number | null;
};

/** All-market liquidations — denser than per-symbol; we filter to majors. */
const WS_URL = "wss://fstream.binance.com/ws/!forceOrder@arr";
const ALLOWED = new Set(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
const WINDOW_MS = 60 * 60 * 1000;
const MAX_EVENTS = 200;
const MAX_BACKOFF_MS = 30_000;

type RawForce = {
  e?: string;
  o?: {
    s?: string;
    S?: string;
    p?: string;
    q?: string;
    ap?: string;
    z?: string;
    T?: number;
  };
};

type RawMsg = RawForce & {
  stream?: string;
  data?: RawForce;
};

function parseEvent(raw: RawMsg): ForceLiqEvent | null {
  const payload = raw.data?.o ? raw.data : raw;
  const o = payload.o;
  if (!o?.s || !o.S) return null;
  const symbol = o.s.toUpperCase();
  if (!ALLOWED.has(symbol)) return null;
  const price = Number(o.ap || o.p);
  const qty = Number(o.z || o.q);
  if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return null;
  const time = o.T ?? Date.now();
  return {
    id: `${symbol}-${time}-${price}-${qty}`,
    symbol: symbol as ForceLiqEvent["symbol"],
    side: o.S === "SELL" ? "long" : "short",
    price,
    qty,
    notional: price * qty,
    time,
  };
}

function prune(events: ForceLiqEvent[]): ForceLiqEvent[] {
  const cutoff = Date.now() - WINDOW_MS;
  return events.filter((e) => e.time >= cutoff).slice(-MAX_EVENTS);
}

function summarize(
  events: ForceLiqEvent[],
  connection: ForceLiqConnection,
): ForceLiqWindow {
  const fresh = prune(events);
  let longNotional = 0;
  let shortNotional = 0;
  for (const e of fresh) {
    if (e.side === "long") longNotional += e.notional;
    else shortNotional += e.notional;
  }
  const bias: ForceLiqWindow["bias"] =
    longNotional > shortNotional * 1.25
      ? "long"
      : shortNotional > longNotional * 1.25
        ? "short"
        : "neutral";
  return {
    connection,
    events: [...fresh].sort((a, b) => b.notional - a.notional),
    longNotional,
    shortNotional,
    bias,
    lastEventAt: fresh.length ? Math.max(...fresh.map((e) => e.time)) : null,
  };
}

const EMPTY: ForceLiqWindow = {
  connection: "connecting",
  events: [],
  longNotional: 0,
  shortNotional: 0,
  bias: "neutral",
  lastEventAt: null,
};

/**
 * Live Binance USD-M forceOrder stream (public, no API key).
 * Sliding 60-minute window of real liquidations for BTC/ETH/SOL.
 */
export function useForceLiquidations(): ForceLiqWindow {
  const [state, setState] = useState<ForceLiqWindow>(EMPTY);
  const eventsRef = useRef<ForceLiqEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const connRef = useRef<ForceLiqConnection>("connecting");
  const backoffRef = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pruneTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  /** Prevents intentional close()/Strict Mode cleanup from scheduling reconnect. */
  const skipCloseReconnectRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const publish = (connection: ForceLiqConnection) => {
      connRef.current = connection;
      eventsRef.current = prune(eventsRef.current);
      setState(summarize(eventsRef.current, connection));
    };

    const clearReconnect = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const disposeSocket = () => {
      const ws = wsRef.current;
      wsRef.current = null;
      if (!ws) return;
      skipCloseReconnectRef.current = true;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      skipCloseReconnectRef.current = false;
    };

    const connect = () => {
      if (stoppedRef.current) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        publish("offline");
        return;
      }

      clearReconnect();
      disposeSocket();
      publish(backoffRef.current > 1000 ? "reconnecting" : "connecting");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (stoppedRef.current) {
          disposeSocket();
          return;
        }
        backoffRef.current = 1000;
        publish("live");
      };

      ws.onmessage = (ev) => {
        try {
          const parsed = parseEvent(JSON.parse(String(ev.data)) as RawMsg);
          if (!parsed) return;
          eventsRef.current = [...eventsRef.current, parsed];
          publish("live");
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => {
        /* onclose handles reconnect */
      };

      ws.onclose = () => {
        if (skipCloseReconnectRef.current || stoppedRef.current) return;
        wsRef.current = null;
        publish("reconnecting");
        const wait = backoffRef.current;
        backoffRef.current = Math.min(MAX_BACKOFF_MS, wait * 2);
        reconnectTimer.current = setTimeout(connect, wait);
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearReconnect();
        disposeSocket();
        publish("offline");
      } else if (!stoppedRef.current) {
        backoffRef.current = 1000;
        connect();
      }
    };

    connect();
    pruneTimer.current = setInterval(() => {
      publish(connRef.current);
    }, 30_000);

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stoppedRef.current = true;
      clearReconnect();
      if (pruneTimer.current) clearInterval(pruneTimer.current);
      document.removeEventListener("visibilitychange", onVisibility);
      disposeSocket();
    };
  }, []);

  return state;
}
