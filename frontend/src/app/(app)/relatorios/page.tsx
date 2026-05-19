"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3 } from "lucide-react";

interface ReportRow {
  matricula_id: string;
  aluno_nome: string;
  oficina_nome: string;
  total_aulas: number;
  presencas: number;
  percentual_presenca: number;
  status: string;
}

interface Oficina { id: string; nome: string; }

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  desistente: "Desistente",
};

export default function RelatoriosPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get<Oficina[]>("/oficinas").then(setOficinas).catch(() => {});
  }, []);

  useEffect(() => {
    const params = filter !== "all" ? `?oficina_id=${filter}` : "";
    api.get<ReportRow[]>(`/relatorios${params}`).then(setData).catch(() => toast.error("Erro ao carregar relatório"));
  }, [filter]);

  const exportCSV = () => {
    const header = "Aluno,Oficina,Aulas,Presenças,Frequência %,Status";
    const rows = data.map((r) =>
      `"${r.aluno_nome}","${r.oficina_nome}",${r.total_aulas},${r.presencas},${r.percentual_presenca}%,"${statusLabels[r.status] || r.status}"`
    );
    const csv = "﻿" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-ellp-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Resumo de frequência e aprovação dos alunos</p>
        </div>
        <Button onClick={exportCSV} disabled={data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Select value={filter} onValueChange={(v) => setFilter(v || "all")}>
            <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="Filtrar por oficina" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as oficinas</SelectItem>
              {oficinas.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Sem dados ainda</p>
              <p className="text-sm">Cadastre aulas e registre presenças para gerar relatórios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead className="text-center">Aulas</TableHead>
                  <TableHead className="text-center">Presenças</TableHead>
                  <TableHead className="text-center">Frequência</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.matricula_id}>
                    <TableCell className="font-medium">{row.aluno_nome}</TableCell>
                    <TableCell>{row.oficina_nome}</TableCell>
                    <TableCell className="text-center">{row.total_aulas}</TableCell>
                    <TableCell className="text-center">{row.presencas}</TableCell>
                    <TableCell className="text-center">
                      <span className={row.percentual_presenca >= 75 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                        {row.percentual_presenca}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "aprovado" ? "outline" : row.status === "reprovado" ? "destructive" : "secondary"}>
                        {statusLabels[row.status] || row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
