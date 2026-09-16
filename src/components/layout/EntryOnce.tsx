"use client";

import { useEffect } from "react";

/**
 * Fecha a entrada coreografada: `enter-pending` é marcado pelo bootstrap de
 * <head> antes do primeiro paint; aqui retira-se a marca quando a sequência
 * terminou (delay máx. 450ms + --dur-slow 480ms). Navegações seguintes na
 * mesma sessão já não reanimam.
 */
export function EntryOnce() {
  useEffect(() => {
    const el = document.documentElement;
    if (!el.classList.contains("enter-pending")) return;
    const id = window.setTimeout(() => {
      el.classList.remove("enter-pending");
    }, 1100);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
