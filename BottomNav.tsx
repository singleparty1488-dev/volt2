import { Link } from "@tanstack/react-router";
import { BarChart3, Plus, Trophy, User, Vault } from "lucide-react";

const items = [
  { to: "/", label: "Хранилище", icon: Vault },
  { to: "/achievements", label: "Достижения", icon: Trophy },
  { to: "/stats", label: "Статистика", icon: BarChart3 },
  { to: "/profile", label: "Профиль", icon: User },
] as const;

export function BottomNav({ onCreate }: { onCreate: () => void }) {
  const [left, right] = [items.slice(0, 2), items.slice(2)];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-vault-deep/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-2 pb-2">
        {left.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCreate}
            aria-label="Создать ячейку"
            className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-gold to-gold/80 text-gold-foreground shadow-[0_12px_30px_-10px_oklch(0.83_0.14_88/0.6)] transition-transform active:scale-95"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        {right.map((i) => (
          <NavItem key={i.to} {...i} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Vault;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-medium text-muted-foreground transition-colors [&.active]:text-gold"
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
