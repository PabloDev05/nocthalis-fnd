/**
 * Arena logic — Duel timers manager
 * ------------------------------------------------------------------
 * Centraliza la gestión de timers de animación:
 *  - Guardar referencias de setTimeout
 *  - Cancelarlos todos al limpiar
 *  - Agendar callbacks en milisegundos relativos
 *
 * Mantener sin React, sólo funciones puras + refs externas.
 */

/* ────────────────────────── tipos ────────────────────────── */

/**
 * Una referencia mutable que contiene los IDs de timers activos.
 * Normalmente se guarda en un useRef<number[]>([]).
 */
export type TimerRef = { current: number[] };

/* ────────────────────────── funciones ────────────────────── */

/**
 * Limpia todos los timeouts activos y vacía el ref.
 */
export function clearTimers(timerRef: TimerRef) {
  for (const t of timerRef.current) {
    window.clearTimeout(t);
  }
  timerRef.current = [];
}

/**
 * Agenda un callback y almacena el id en el ref.
 * Devuelve el id del timeout creado.
 */
export function scheduleTimer(timerRef: TimerRef, cb: () => void, delayMs: number): number {
  const id = window.setTimeout(cb, delayMs);
  timerRef.current.push(id);
  return id;
}

/**
 * Ejecuta una lista de eventos cronometrados.
 *
 * @param timerRef - referencia donde se almacenan los IDs
 * @param events - lista de { atMs, run }
 *
 * Cada evento se ejecuta con un setTimeout en el tiempo indicado.
 */
export function scheduleEvents(timerRef: TimerRef, events: Array<{ atMs: number; run: () => void }>) {
  for (const ev of events) {
    scheduleTimer(timerRef, ev.run, ev.atMs);
  }
}
