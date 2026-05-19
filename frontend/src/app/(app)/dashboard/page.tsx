"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, ClipboardList, TrendingUp, Calendar } from "lucide-react";

interface OficinaStats {
  id: string;
  nome: string;
  status: string;
  total_matriculas: number;
  total_aulas: number;
  media_presenca: number;
}

interface DashboardStats {
  total_alunos: number;
  oficinas_ativas: number;
  matriculas_ativas: number;
  media_presenca: number;
  por_oficina: OficinaStats[];
}

const statusLabels: Record<string, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
};

const statusVariants: Record<string, "default" | "secondary"> = {
  planejada: "secondary",
  em_andamento: "default",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/relatorios/dashboard").then(setStats).catch(console.error);
  }, []);

  const cards = [
    { label: "Alunos cadastrados", value: stats?.total_alunos ?? 0, icon: Users },
    { label: "Oficinas ativas", value: stats?.oficinas_ativas ?? 0, icon: BookOpen },
    { label: "Matrículas ativas", value: stats?.matriculas_ativas ?? 0, icon: ClipboardList },
    { label: "Frequência média", value: `${stats?.media_presenca ?? 0}%`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
        <p className="text-muted-foreground mt-1">
          Painel de controle do projeto ELLP — Escritório de Livre Leitura e Pesquisa
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{card.label}</CardDescription>
              <card.icon className={`h-5 w-5 text-muted-foreground ${card.color || ""}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${card.color || ""}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.por_oficina.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Oficinas ativas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.por_oficina.map((oficina) => (
              <Card key={oficina.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{oficina.nome}</CardTitle>
                    <Badge variant={statusVariants[oficina.status] || "secondary"}>
                      {statusLabels[oficina.status] || oficina.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{oficina.total_matriculas} alunos</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{oficina.total_aulas} aulas</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frequência média</span>
                      <span className={oficina.media_presenca >= 75 ? "text-green-600 font-medium" : oficina.media_presenca > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {oficina.media_presenca}%
                      </span>
                    </div>
                    <Progress value={oficina.media_presenca} className="h-2" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/presenca?oficina=${oficina.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Presença</Button>
                    </Link>
                    <Link href={`/relatorios`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Relatório</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Como começar</CardTitle>
          <CardDescription>Siga estes passos para configurar suas oficinas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">1. Cadastre os <strong>alunos</strong> participantes</p>
          <p className="text-sm text-muted-foreground">2. Crie as <strong>oficinas</strong> com professor e tutores</p>
          <p className="text-sm text-muted-foreground">3. Realize as <strong>matrículas</strong> dos alunos nas oficinas</p>
          <p className="text-sm text-muted-foreground">4. Registre a <strong>presença</strong> a cada aula</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/oficinas">
              <Button>Nova oficina</Button>
            </Link>
            <Link href="/presenca">
              <Button variant="outline">Registrar presença</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
