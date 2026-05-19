import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import NNotificationCenter from "@/components/notifications/NNotificationCenter";
import { useAuthStore } from "@/store/useAuthStore";
import { useTheme } from "@/hooks/useTheme";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

const bubbleColors = ["#42C9E4", "#87D4F3", "#B8EDF3"];

const bubbleGroups = [
  {
    size: 72,
    duration: 12,
    opacity: 0.42,
    scale: 1,
    blur: 0,
  },
  {
    size: 48,
    duration: 18,
    opacity: 0.34,
    scale: 1,
    blur: 0,
  },
  {
    size: 28,
    duration: 26,
    opacity: 0.24,
    scale: 1,
    blur: 0,
  },
];

const bubbles = Array.from({ length: 30 }, (_, index) => {
  const group = bubbleGroups[index % bubbleGroups.length];
  const column = index % 10;
  const row = Math.floor(index / 10);
  const left = 5 + column * 9.5 + (row % 2 === 0 ? 0 : 2.5);

  return {
    id: index,
    left,
    startOffset: 12 + ((index * 7) % 24),
    color: bubbleColors[index % bubbleColors.length],
    size: group.size,
    duration: group.duration,
    opacity: group.opacity,
    scale: group.scale,
    blur: group.blur,
    delay: -(index * 1.8),
  };
});

function NLayout() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const initializeSession = useAuthStore((state) => state.initializeSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const { isDark, logoSrc } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    initializeSession();
  }, [hasHydrated, initializeSession]);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden flex flex-col bg-sinapgreen-500 dark:bg-gray-900">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className="nlayout-bubble absolute rounded-full"
            style={{
              left: `${bubble.left}%`,
              top: `calc(100% + ${bubble.startOffset}px)`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              backgroundColor: bubble.color,
              opacity: bubble.opacity,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`,
              transform: "translate3d(0, 0, 0) scale(var(--bubble-scale))",
              "--bubble-scale": bubble.scale,
              "--bubble-opacity": bubble.opacity,
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.08)",
              filter: bubble.blur ? `blur(${bubble.blur}px)` : "none",
              transformOrigin: "center",
            }}
          />
        ))}
      </div>
      <header className="relative z-10 w-full px-10 pb-10 text-black">
        <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg dark:bg-gray-800 w-full px-15 py-10 rounded-b-[5rem]">
          <Link to="/home">
            <img
              src={logoSrc}
              alt="Sinapsense Logo"
              className="h-15 sm:h-20 w-auto max-w-full object-contain mr-4 shrink-0"
              loading="lazy"
            />
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex items-center justify-center rounded-3xl bg-gray-800 p-2 text-white transition-colors dark:bg-gray-200 dark:text-black"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {isDark ? <WbSunnyIcon /> : <DarkModeIcon />}
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center rounded-3xl bg-gray-800 p-2 text-white transition-colors dark:bg-gray-200 dark:text-black"
                aria-label="Sair da conta"
              >
                <ExitToAppIcon />
              </button>
            ) : null}
          </div>
        </nav>
      </header>
      <main className="relative z-10 flex-1 px-10 pb-10">
        <Outlet />
      </main>
      <div className="relative z-20">
        <NNotificationCenter />
      </div>
    </div>
  );
}

export default NLayout;
