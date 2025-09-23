import { useEffect, useRef, useState } from "react";

export default function useGlowOnChange(
  obj?: Record<string, number | undefined> | null,
  durationMs: number = 900 // ⟵ configurable
) {
  const prevRef = useRef<Record<string, number | undefined> | null>(null);
  const [glow, setGlow] = useState<Record<string, number>>({});
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!obj) return;

    // Evitar glow en el primer render
    if (prevRef.current === null) {
      prevRef.current = obj;
      return;
    }

    const prev = prevRef.current || {};
    // Unión de claves para detectar cambios y también eliminaciones
    const keys = new Set([...Object.keys(obj), ...Object.keys(prev)]);
    const changed: string[] = [];
    keys.forEach((k) => {
      const now = Number(obj[k] ?? 0);
      const before = Number(prev[k] ?? 0);
      if (Math.abs(now - before) > 1e-6) changed.push(k);
    });

    if (changed.length) {
      const ts = Date.now();
      setGlow((g) => {
        const n = { ...g };
        for (const k of changed) n[k] = ts;
        return n;
      });

      // reiniciar timeout de “apagado”
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutRef.current = window.setTimeout(() => {
        const cutoff = Date.now() - durationMs;
        setGlow((g) => {
          const n: Record<string, number> = {};
          for (const [k, t] of Object.entries(g)) if (t > cutoff) n[k] = t;
          return n;
        });
        timeoutRef.current = null;
      }, durationMs);
    }

    // ✅ ACTUALIZAR SIEMPRE el previo (incluso cuando hubo cambios)
    prevRef.current = obj;

    // cleanup en cambios de dependencia / unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [obj, durationMs]);

  return glow; // se usa como Boolean(glow[key])
}
