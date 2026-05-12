"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/professores", label: "Professores", icon: GraduationCap },
  { href: "/tutores", label: "Tutores", icon: UserCheck },
  { href: "/oficinas", label: "Oficinas", icon: BookOpen },
  { href: "/matriculas", label: "Matrículas", icon: ClipboardList },
  { href: "/presenca", label: "Presença", icon: CheckSquare },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Oficina ELLP</h2>
            <p className="text-xs text-muted-foreground">Gestão de Oficinas</p>
          </div>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === item.href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        {user?.role === "admin" && (
          <>
            <Separator className="my-2" />
            <Link
              href="/configuracoes"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/configuracoes"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </>
        )}
      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {user?.role === "admin" ? "Administrador" : "Professor"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
