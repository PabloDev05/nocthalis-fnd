import VersionBadge from "../../../components/VersionBadge";
import { Settings, Swords, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      id: "character",
      label: "CHARACTER",
      icon: User,
      href: "/game",
      disabled: false,
    },
    {
      id: "arena",
      label: "ARENA",
      icon: Swords,
      href: "/arena",
      disabled: false,
    },
    {
      id: "options",
      label: "OPTIONS",
      icon: Settings,
      href: "/options",
      disabled: true,
    },
  ];

  return (
    <aside
      className="
        lg:col-span-2 dark-panel p-2 rounded-lg shadow-lg border border-[var(--border)]
        /* clave: que estire y tenga alto mínimo de viewport útil */
        relative flex flex-col h-full min-h-[calc(100dvh-6rem)]
      "
    >
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon as any;
          const active =
            (item.id === "character" &&
              location.pathname.startsWith("/game")) ||
            (item.id === "arena" && location.pathname.startsWith("/arena")) ||
            (item.id === "options" && location.pathname.startsWith("/options"));
          const cls = `w-full gothic-button flex items-center space-x-3 text-left ${active ? "active" : ""}`;
          if (item.disabled) {
            return (
              <div
                key={item.id}
                aria-disabled
                className={`${cls} opacity-50 cursor-not-allowed`}
                title="Coming soon"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.href)}
              className={cls}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* reservamos espacio inferior y fijamos el badge al fondo */}
      <div className="pb-6" />
      <div className="absolute left-2 right-2 bottom-2">
        <VersionBadge />
      </div>
    </aside>
  );
}
