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

export type ForceLiqConnection = "connecting" | "live" | "reconnecting" | "offline";

export type ForceLiqWindow = {
  connection: ForceLiqConnection;
  events: ForceLiqEvent[];
  longNotional: number;
  shortNotional: number;
  bias: "long" | "short" | "neutral";
  lastEventAt: number | null;
};

const STREAMS = ["btcusdt@forceOrder", "ethusdt@forceOrder", "solusdt@forceOrder"];
const WS_URL = `wss://fstream.binance.com/stream?streams=${STREAMS.join("/")}`;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_EVENTS = 200;
const MAX_BACKOFF_MS = 30_000;

type RawMsg = {
  stream?: string;
  data?: {
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
};

function parseEvent(raw: RawMsg): ForceLiqEvent | null {
  const o = raw.data?.o;
  if (!o?.s || !o.S) return null;
  const symbol = o.s.toUpperCase() as ForceLiqEvent["symbol"];
  if (symbol !== "BTCUSDT" && symbol !== "ETHUSDT" && symbol !== "SOLUSDT") {
    return null;
  }
  const price = Number(o.ap || o.p);
  const qty = Number(o.z || o.q);
  if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return null;
  const time = o.T ?? Date.now();
  return {
    id: `${symbol}-${time}-${price}-${qty}`,
    symbol,
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
 * Maintains a sliding 60-minute window of real liquidations.
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

    const connect = () => {
      if (stoppedRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        publish("offline");
        return;
      }

      clearReconnect();
      wsRef.current?.close();
      publish(backoffRef.current > 1000 ? "reconnecting" : "connecting");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (stoppedRef.current) {
          ws.close();
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
        if (stoppedRef.current) return;
        publish("reconnecting");
        const wait = backoffRef.current;
        backoffRef.current = Math.min(MAX_BACKOFF_MS, wait * 2);
        reconnectTimer.current = setTimeout(connect, wait);
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearReconnect();
        wsRef.current?.close();
        wsRef.current = null;
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
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return state;
}
