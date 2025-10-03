import { Howl, Howler } from "howler";

/** Incluí los UI sfx para que puedas llamarlos sin error. */
export type SfxKind = "hit" | "miss" | "block" | "crit" | "dot" | "ultimate" | "passive" | "status" | "uiClick" | "uiStart" | "uiReward" | "ui_selected"; // 👈 NUEVO: fanfarria de recompensas

export type SfxConfig = Partial<Record<SfxKind, string | string[]>>;

type Bank = {
  urls: string[];
  howls: Howl[];
};

const now = () => performance.now?.() ?? Date.now();

export class SoundManager {
  private bank: Partial<Record<SfxKind, Bank>> = {};
  private enabled = true;
  private master = 0.8;
  private cooldownMs = 90; // evita “ametralladora”
  private lastPlay: Partial<Record<SfxKind, number>> = {};

  constructor(initial?: SfxConfig) {
    if (initial) this.setMany(initial);
    Howler.volume(this.master);
  }

  /** On/Off global */
  setEnabled(v: boolean) {
    this.enabled = !!v;
  }
  isEnabled() {
    return this.enabled;
  }

  /** Volumen maestro [0..1] */
  setMasterVolume(v: number) {
    this.master = Math.max(0, Math.min(1, v));
    Howler.volume(this.master);
  }
  getMasterVolume() {
    return this.master;
  }

  /** Cooldown mínimo entre reproducciones del mismo tipo */
  setCooldown(ms: number) {
    this.cooldownMs = Math.max(0, Math.round(ms));
  }

  /** Carga de golpe varias entradas */
  setMany(cfg: SfxConfig) {
    Object.entries(cfg).forEach(([k, v]) => this.set(k as SfxKind, v as any));
  }

  /** Define (o reemplaza) los sonidos para un tipo */
  set(kind: SfxKind, urls: string | string[] | undefined | null) {
    if (!urls || (Array.isArray(urls) && urls.length === 0)) {
      delete this.bank[kind];
      return;
    }
    const list = Array.isArray(urls) ? urls : [urls];
    this.bank[kind] = { urls: list, howls: [] };
  }

  /** Pre-carga todos o solo algunos sfx (mejora el primer play) */
  preload(kinds?: SfxKind[]) {
    if (kinds && kinds.length) {
      kinds.forEach((k) => this.prepare(k));
      return;
    }
    Object.keys(this.bank).forEach((k) => this.prepare(k as SfxKind));
  }

  /** Reproduce un tipo */
  play(kind: SfxKind, opts?: { rate?: number; volume?: number }) {
    if (!this.enabled) return;
    const b = this.prepare(kind);
    if (!b) return;

    const t = now();
    const last = this.lastPlay[kind] ?? 0;
    if (t - last < this.cooldownMs) return; // throttle

    const pick = Math.floor(Math.random() * b.howls.length);
    const h = b.howls[pick];
    if (!h) return;

    if (opts?.rate != null) h.rate(opts.rate);
    if (opts?.volume != null) h.volume(opts.volume);

    try {
      h.play();
    } catch {
      /* algunos navegadores bloquean: noop */
    }

    this.lastPlay[kind] = t;
  }

  /** Silencia todo (útil al salir del duelo) */
  stopAll() {
    Object.values(this.bank).forEach((b) => b?.howls.forEach((h) => h.stop()));
  }

  /**
   * Desbloquea el audio en iOS/Android: llamar dentro de un gesto de usuario
   * (p.ej., al hacer click en el botón "Attack").
   */
  async unlock() {
    const ctx: AudioContext | undefined = (Howler as any).ctx;
    try {
      if (ctx && ctx.state !== "running" && ctx.resume) {
        await ctx.resume();
      }
      // Disparo suave y silencioso para “calentar” el contexto
      const silent = new Howl({ src: [""], volume: 0 }); // src vacío no suena
      try {
        silent.play();
        silent.stop();
        silent.unload();
      } catch {}
    } catch {}
  }

  /** Libera recursos si hace falta */
  dispose() {
    Object.values(this.bank).forEach((b) => b?.howls.forEach((h) => h.unload()));
    this.bank = {};
  }

  /** Interno: crea los Howl si aún no existen */
  private prepare(kind: SfxKind): Bank | null {
    const b = this.bank[kind];
    if (!b) return null;
    if (b.howls.length === 0) {
      b.howls = b.urls.map((url) => new Howl({ src: [url], volume: 1 }));
    }
    return b;
  }
}

/** Singleton listo para usar.
 * Coloca tus archivos en: /public/assets/sfx/
 * y mapea aquí. Puedes poner arrays para variar aleatoriamente.
 */
export const soundManager = new SoundManager({
  //   hit: ["/assets/sfx/hit_1.mp3", "/assets/sfx/hit_2.mp3"],
  crit: ["/assets/sfx/crit_1.mp3", "/assets/sfx/crit_2.mp3", "/assets/sfx/crit_3.mp3"],
  block: ["/assets/sfx/block_1.mp3", "/assets/sfx/block_2.mp3"],
  miss: ["/assets/sfx/miss_1.mp3", "/assets/sfx/miss_2.mp3"],
  //   dot: "/assets/sfx/dot_1.mp3",
  //   ultimate: "/assets/sfx/ultimate_1.mp3",
  //   passive: "/assets/sfx/passive_1.mp3",
  //   status: "/assets/sfx/status_1.mp3",
  //   uiClick: "/assets/sfx/ui_click.mp3",

  // 👇 UI
  ui_selected: "/assets/sfx/ui_selected.mp3",
  uiStart: "/assets/sfx/ui_start_fight.mp3",
  uiReward: "/assets/sfx/ui_reward.mp3", // 👈 NUEVO: fanfarria de recompensas
});
