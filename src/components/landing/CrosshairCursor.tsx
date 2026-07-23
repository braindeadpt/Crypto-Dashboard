"use client";

import { useEffect, useState } from "react";

/** Desktop-only crosshair for command-center feel. Hidden on touch. */
export function CrosshairCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setActive(true);
    };
    const onLeave = () => setActive(false);

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      className={`crosshair-layer ${active ? "is-active" : ""}`}
      aria-hidden
    >
      <div className="crosshair-v" style={{ left: pos.x }} />
      <div className="crosshair-h" style={{ top: pos.y }} />
      <div
        className="crosshair-ring"
        style={{ left: pos.x, top: pos.y }}
      />
    </div>
  );
}
