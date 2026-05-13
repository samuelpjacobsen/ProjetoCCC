"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, ClipboardList, TrendingUp } from "lucide-react";

interface DashboardStats {
  total_alunos: number;
  oficinas_ativas: number;
  matriculas_ativas: number;
  media_presenca: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/relatorios/dashboard").then(setStats).catch(console.error);
  }, []);

  const cards = [
    { label: "Alunos cadastrados", value: stats?.total_alunos ?? 0, icon: Users, color: "" },
    { label: "Oficinas ativas", value: stats?.oficinas_ativas ?? 0, icon: BookOpen, color: "" },
    { label: "Matrículas ativas", value: stats?.matriculas_ativas ?? 0, icon: ClipboardList, color: "" },
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
              <card.icon className={`h-5 w-5 text-muted-foreground ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
          <div className="flex gap-3 pt-4">
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
