import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Terms of Use", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Legal notice", href: "/legal/notice" },
  { label: "Forum", href: "/forum" },
  { label: "Support", href: "/support" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <header className="relative z-10 dark-panel mt-3 mb-2 p-3 md:p-4 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <h1 className="text-2xl md:text-3xl font-bold stat-text tracking-wide font-serif">
          Nocthalis
        </h1>
      </div>
      <nav className="hidden md:flex items-center space-x-5 text-xs">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            target="_blank"
            rel="noreferrer"
            href={item.href}
            className="stat-text-muted hover:text-gray-300"
          >
            {item.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="stat-text-muted hover:text-gray-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-weak)] rounded-sm"
          title="Log out"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
