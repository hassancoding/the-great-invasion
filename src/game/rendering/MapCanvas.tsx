"use client";

import { useRef, useEffect, useCallback } from "react";
import { Territory, Nation } from "@/types/game";
import { GAME_CONFIG } from "@/config/gameConfig";

interface MapCanvasProps {
  territories: Territory[];
  nations: Nation[];
  onClaim: (id: number) => void;
  width: number;
  height: number;
  interactive: boolean;
}

export default function MapCanvas({
  territories,
  nations,
  onClaim,
  width,
  height,
  interactive,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const getNationColor = useCallback(
    (owner: string | null) => {
      if (!owner) return GAME_CONFIG.colors.neutral;
      const n = nations.find((x) => x.id === owner);
      return n ? n.color : GAME_CONFIG.colors.neutral;
    },
    [nations]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = GAME_CONFIG.colors.mapBg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = GAME_CONFIG.colors.grid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo((width / 8) * i, 0);
      ctx.lineTo((width / 8) * i, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (height / 6) * i);
      ctx.lineTo(width, (height / 6) * i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    territories.forEach((t) => {
      t.adjacent.forEach((adjId) => {
        if (adjId > t.id) {
          const other = territories[adjId];
          if (!other) return;
          ctx.beginPath();
          ctx.moveTo(t.x * width, t.y * height);
          ctx.lineTo(other.x * width, other.y * height);
          ctx.stroke();
        }
      });
    });

    territories.forEach((t) => {
      const cx = t.x * width;
      const cy = t.y * height;
      const radius = Math.max(14, Math.min(width, height) * 0.035);

      if (t.owner === "player" || t.contested) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle =
          t.owner === "player"
            ? "rgba(59, 130, 246, 0.25)"
            : "rgba(245, 158, 11, 0.3)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = getNationColor(t.owner);
      ctx.fill();

      ctx.strokeStyle = t.contested ? GAME_CONFIG.colors.contested : "#0f172a";
      ctx.lineWidth = t.contested ? 3 : 2;
      ctx.stroke();

      if (t.value >= 4) {
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(cx, cy - radius * 0.4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [territories, nations, width, height, getNationColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 80) {
        draw();
        last = t;
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handlePointer = (e: React.PointerEvent) => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    let nearest: Territory | null = null;
    let minDist = 0.08;

    territories.forEach((t) => {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < minDist) {
        minDist = d;
        nearest = t;
      }
    });

    if (nearest !== null) {
      onClaim((nearest as Territory).id);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, touchAction: "none" }}
      className="rounded-xl shadow-2xl border border-slate-700/50"
      onPointerDown={handlePointer}
    />
  );
}
