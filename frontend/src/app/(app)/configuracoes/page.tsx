"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  professor: "Professor",
  tutor: "Tutor",
  pendente: "Pendente",
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "default",
  professor: "secondary",
  tutor: "outline",
  pendente: "destructive",
};

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    load();
  }, [user]);

  const load = () => {
    api.get<UserProfile[]>("/users").then(setUsers).catch(() => toast.error("Erro ao carregar usuarios"));
  };

  const changeRole = async (id: string, newRole: string) => {
    if (id === user?.id) {
      toast.error("Voce nao pode alterar seu proprio papel");
      return;
    }
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      toast.success(`Papel alterado para ${roleLabels[newRole]}`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = filter === "all" ? users : users.filter((u) => u.role === filter);
  const pendingCount = users.filter((u) => u.role === "pendente").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie os usuarios e papeis do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-base">Como funciona?</CardTitle>
              <CardDescription>
                Novos usuarios se cadastram pela tela de login e ficam com status &quot;Pendente&quot;.
                Defina o papel de cada usuario aqui: Professor, Tutor ou Administrador.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {pendingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              {pendingCount} {pendingCount === 1 ? "usuario aguardando" : "usuarios aguardando"} aprovacao
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Select value={filter} onValueChange={(v) => setFilter(v || "all")}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <span className="truncate">
                  {filter === "all" ? "Todos os usuarios" : roleLabels[filter] || filter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuarios</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="professor">Professores</SelectItem>
                <SelectItem value="tutor">Tutores</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="w-[180px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariants[u.role] || "secondary"}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.id === user?.id ? (
                      <span className="text-xs text-muted-foreground">Voce</span>
                    ) : (
                      <Select
                        value={u.role === "pendente" ? undefined : u.role}
                        onValueChange={(v) => v && changeRole(u.id, v)}
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          <span className="truncate text-xs">
                            {u.role === "pendente" ? "Aprovar como..." : roleLabels[u.role]}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="tutor">Tutor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
