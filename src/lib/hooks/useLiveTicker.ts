"use client";

import { useEffect, useRef, useState } from "react";

export type TickerSymbol = "BTCUSDT" | "ETHUSDT" | "SOLUSDT";

export type LiveTickerQuote = {
  price: number;
  change24h: number;
  lastUpdate: number;
};

export type LiveTickerConnection =
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

export type LiveTickerState = {
  connection: LiveTickerConnection;
  quotes: Partial<Record<TickerSymbol, LiveTickerQuote>>;
  lastUpdate: number | null;
};

const STREAMS = ["btcusdt@ticker", "ethusdt@ticker", "solusdt@ticker"];
const WS_URL = `wss://stream.binance.com:9443/stream?streams=${STREAMS.join("/")}`;
const MAX_BACKOFF_MS = 30_000;

type Seed = Partial<
  Record<TickerSymbol, { price: number; change24h: number }>
>;

type RawTicker = {
  stream?: string;
  data?: {
    s?: string;
    c?: string;
    P?: string;
  };
};

/**
 * Live Binance spot @ticker for BTC/ETH/SOL (public, no API key).
 * Seeds from server props to avoid flash; reconnects with backoff;
 * pauses when the tab is hidden.
 */
export function useLiveTicker(seed: Seed): LiveTickerState {
  const [connection, setConnection] =
    useState<LiveTickerConnection>("connecting");
  const [quotes, setQuotes] = useState<LiveTickerState["quotes"]>(() => {
    const init: LiveTickerState["quotes"] = {};
    for (const [sym, q] of Object.entries(seed) as [
      TickerSymbol,
      { price: number; change24h: number },
    ][]) {
      if (q) {
        init[sym] = {
          price: q.price,
          change24h: q.change24h,
          lastUpdate: Date.now(),
        };
      }
    }
    return init;
  });
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const skipCloseReconnectRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

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
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        setConnection("offline");
        return;
      }

      clearReconnect();
      disposeSocket();
      setConnection(backoffRef.current > 1000 ? "reconnecting" : "connecting");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (stoppedRef.current) {
          disposeSocket();
          return;
        }
        backoffRef.current = 1000;
        setConnection("live");
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as RawTicker;
          const d = msg.data;
          if (!d?.s || d.c == null) return;
          const symbol = d.s.toUpperCase() as TickerSymbol;
          if (
            symbol !== "BTCUSDT" &&
            symbol !== "ETHUSDT" &&
            symbol !== "SOLUSDT"
          ) {
            return;
          }
          const price = Number(d.c);
          const change24h = Number(d.P);
          if (!Number.isFinite(price)) return;
          const at = Date.now();
          setQuotes((prev) => ({
            ...prev,
            [symbol]: {
              price,
              change24h: Number.isFinite(change24h)
                ? change24h
                : (prev[symbol]?.change24h ?? 0),
              lastUpdate: at,
            },
          }));
          setLastUpdate(at);
          setConnection("live");
        } catch {
          /* ignore malformed */
        }
      };

      ws.onerror = () => {
        /* onclose handles reconnect */
      };

      ws.onclose = () => {
        if (skipCloseReconnectRef.current || stoppedRef.current) return;
        wsRef.current = null;
        setConnection("reconnecting");
        const wait = backoffRef.current;
        backoffRef.current = Math.min(MAX_BACKOFF_MS, wait * 2);
        reconnectTimer.current = setTimeout(connect, wait);
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearReconnect();
        disposeSocket();
        setConnection("offline");
      } else if (!stoppedRef.current) {
        backoffRef.current = 1000;
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stoppedRef.current = true;
      clearReconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      disposeSocket();
    };
  }, []);

  return { connection, quotes, lastUpdate };
}
