// context/SoundProvider.tsx
// Administrar volumen/mute y setear sonidos por usuario con React Context:
import React, { createContext, useContext, useMemo } from "react";
import {
  SfxConfig,
  soundManager,
  SoundManager,
} from "../lib/sound/SoundManager";

type Ctx = {
  sfx: SoundManager;
  setMany: (cfg: SfxConfig) => void;
  setEnabled: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
};

const SoundCtx = createContext<Ctx | null>(null);

export function SoundProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: SfxConfig;
}) {
  useMemo(() => {
    if (initial) soundManager.setMany(initial);
    soundManager.preload();
  }, [initial]);

  const value: Ctx = {
    sfx: soundManager,
    setMany: (cfg) => soundManager.setMany(cfg),
    setEnabled: (v) => soundManager.setEnabled(v),
    setMasterVolume: (v) => soundManager.setMasterVolume(v),
  };

  return <SoundCtx.Provider value={value}>{children}</SoundCtx.Provider>;
}

export function useSfx() {
  const ctx = useContext(SoundCtx);
  if (!ctx) throw new Error("useSfx must be used within <SoundProvider>");
  return ctx;
}
