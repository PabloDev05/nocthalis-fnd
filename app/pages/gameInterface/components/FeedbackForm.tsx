import { useMemo, useState, useEffect } from "react";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

/* Helpers JWT -> email por si querés prefill automático */
function b64urlDecode(input: string): string {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad === 2) str += "==";
  else if (pad === 3) str += "=";
  return atob(str);
}
function getEmailFromToken(tok?: string | null): string {
  if (!tok) return "";
  try {
    const payload = JSON.parse(b64urlDecode(tok.split(".")[1] || ""));
    return String(payload?.email || "");
  } catch {
    return "";
  }
}

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 600;

type Props = {
  defaultEmail?: string | null;
  defaultUsername?: string | null;
  /** compat antiguo */
  defaultName?: string | null;
};

export default function FeedbackForm({
  defaultEmail = "",
  defaultUsername = "",
  defaultName = "",
}: Props) {
  const { token, user: userFromCtx } = useAuth();

  const emailPrefill = defaultEmail || getEmailFromToken(token) || "";
  const usernamePrefill =
    defaultUsername || defaultName || (userFromCtx ?? "") || "";

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(emailPrefill);
  const [username, setUsername] = useState(usernamePrefill);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showUser, setShowUser] = useState(false);

  useEffect(() => {
    setEmail(emailPrefill);
    setUsername(usernamePrefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailPrefill, usernamePrefill]);

  const left = useMemo(() => Math.max(0, MAX_LEN - message.length), [message]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !EMAIL_RX.test(email))
      return setErr("Ingresá un email válido.");
    if (!message.trim()) return setErr("Escribí tu comentario.");

    try {
      setSending(true);
      await axios.post(
        "/feedback/feed-submit",
        {
          email: email.trim().toLowerCase(),
          username: username.trim() || undefined,
          message: message.trim().slice(0, MAX_LEN),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
        }
      );
      setOk(true);
      setMessage("");
      // Mostrar OK ~1.6s con animación y luego colapsar
      setTimeout(() => {
        setOk(false);
        setOpen(false);
      }, 1600);
    } catch (e: any) {
      setErr("No se pudo enviar. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  /* Colores: usa tu paleta (accent/border/panel), no naranja */
  const accent = "var(--accent,#7c87ff)";

  return (
    <div
      className={`rounded-xl border bg-[var(--panel-2)] shadow-lg relative overflow-hidden
                  ${open ? "border-[var(--border)]" : "border-[var(--border)]"}
                  transition-colors`}
    >
      {/* Header compacto */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left
                   bg-[var(--panel-2)] hover:bg-[color-mix(in_srgb,var(--panel-2)_92%,#9aa0ff_8%)]
                   transition-colors"
        aria-expanded={open}
        aria-controls="feedback-panel"
      >
        <div className="flex items-center gap-2">
          <span className="relative">
            <MessageSquare className={`w-4 h-4`} style={{ color: accent }} />
            {!open && (
              <span
                className="absolute inset-0 rounded-full blur-[6px] opacity-30 animate-pulse"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--accent,#7c87ff) 70%, transparent)",
                }}
              />
            )}
          </span>
          <div>
            <div className="font-semibold text-[12px]">Dejá tu feedback</div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: open ? accent : "var(--muted,#a0a6b1)" }}
        />
      </button>

      {/* línea sweep en color accent cuando está abierto o al enviar OK */}
      <AnimatePresence initial={false}>
        {(open || ok) && (
          <motion.div
            key="sweep"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute top-0 left-0 h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Panel colapsable */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="feedback-panel"
            key="panel"
            initial={{ height: 0, opacity: 0, filter: "brightness(0.9)" }}
            animate={{ height: "auto", opacity: 1, filter: "brightness(1)" }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div className="px-3 pb-3 pt-2 space-y-2.5">
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Email */}
                <div className="space-y-0.5">
                  <label className="text-[11px] text-[var(--muted,#a0a6b1)]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full rounded-lg bg-[var(--panel-3,#0f1320)] border
                               px-2.5 py-1.5 text-[12px] outline-none
                               border-[var(--border)] focus:border-[var(--accent,#7c87ff)]
                               transition-colors"
                  />
                </div>

                {/* Mensaje */}
                <div className="space-y-0.5">
                  <label className="text-[11px] text-[var(--muted,#a0a6b1)]">
                    Descripción
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value.slice(0, MAX_LEN))
                    }
                    placeholder="¿Qué mejorar o qué falló?"
                    rows={3}
                    className="w-full rounded-lg bg-[var(--panel-3,#0f1320)] border
                               px-2.5 py-1.5 text-[12px] outline-none resize-y min-h-[84px]
                               border-[var(--border)] focus:border-[var(--accent,#7c87ff)]
                               transition-colors"
                  />
                  <div className="flex items-center justify-between text-[10px] text-[var(--muted,#a0a6b1)]">
                    <span>Límite: {MAX_LEN}</span>
                    <span>{left} restantes</span>
                  </div>
                </div>

                {/* Error / OK */}
                <AnimatePresence initial={false}>
                  {err && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-[11px] text-red-300 bg-red-400/10 border border-red-400/30 rounded-md px-2 py-1.5"
                    >
                      {err}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {ok && (
                    <motion.div
                      key="ok"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.98, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                      className="relative overflow-hidden text-[11px] text-emerald-300 bg-emerald-300/10 border border-emerald-300/30 rounded-md px-2 py-1.5"
                    >
                      {/* burst radial con el color accent para integrar estética */}
                      <span
                        className="pointer-events-none absolute -inset-1 opacity-40 blur-2xl"
                        style={{
                          background: `radial-gradient(600px 120px at 10% 50%, ${accent}, transparent)`,
                        }}
                      />
                      <span className="relative">
                        ¡Gracias! Feedback enviado.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón */}
                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={sending}
                    whileTap={{ scale: sending ? 1 : 0.98 }}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px]
                               bg-[var(--panel-3,#0f1320)] border-[var(--border)]
                               hover:border-[var(--accent,#7c87ff)]
                               disabled:opacity-60 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Enviando…" : "Enviar"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
