"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Info } from "lucide-react";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: string;
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    load();
  }, [user]);

  const load = () => {
    api.get<UserProfile[]>("/users").then(setUsers).catch(() => toast.error("Erro ao carregar usuários"));
  };

  const promote = async (id: string) => {
    try {
      await api.post(`/users/${id}/promote`, {});
      toast.success("Usuário promovido a administrador");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const demote = async (id: string) => {
    if (id === user?.id) {
      toast.error("Você não pode remover seu próprio papel de admin");
      return;
    }
    try {
      await api.post(`/users/${id}/demote`, {});
      toast.success("Papel de administrador removido");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie os papéis dos usuários do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-base">Como adicionar novos usuários?</CardTitle>
              <CardDescription>
                Novos usuários se cadastram pela tela de login. Depois, você pode promovê-los a administrador aqui.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Administrador" : "Professor"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => demote(u.id)}
                        disabled={u.id === user?.id}
                      >
                        <ShieldOff className="h-4 w-4 mr-1" />
                        Remover admin
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => promote(u.id)}>
                        <Shield className="h-4 w-4 mr-1" />
                        Tornar admin
                      </Button>
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
