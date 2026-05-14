"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ClipboardList } from "lucide-react";

interface Matricula {
  id: string;
  aluno_id: string;
  oficina_id: string;
  aluno_nome: string;
  oficina_nome: string;
  status: string;
}

interface Aluno { id: string; nome: string; }
interface Oficina { id: string; nome: string; }

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  desistente: "Desistente",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ativa: "default",
  aprovado: "outline",
  reprovado: "destructive",
  desistente: "secondary",
};

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ aluno_id: "", oficina_id: "" });
  const [open, setOpen] = useState(false);

  const load = () => {
    const params = filter !== "all" ? `?oficina_id=${filter}` : "";
    api.get<Matricula[]>(`/matriculas${params}`).then(setMatriculas).catch(() => toast.error("Erro ao carregar matrículas"));
  };

  useEffect(() => {
    api.get<Aluno[]>("/alunos").then(setAlunos).catch(() => {});
    api.get<Oficina[]>("/oficinas").then(setOficinas).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/matriculas", form);
      toast.success("Matrícula realizada");
      setOpen(false);
      setForm({ aluno_id: "", oficina_id: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta matrícula? As presenças registradas serão apagadas.")) return;
    try {
      await api.delete(`/matriculas/${id}`);
      toast.success("Matrícula removida");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matrículas</h1>
          <p className="text-muted-foreground">Vincule alunos às oficinas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova matrícula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova matrícula</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Aluno *</Label>
                <Select value={form.aluno_id} onValueChange={(v) => setForm({ ...form, aluno_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno..." /></SelectTrigger>
                  <SelectContent>
                    {alunos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Oficina *</Label>
                <Select value={form.oficina_id} onValueChange={(v) => setForm({ ...form, oficina_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a oficina..." /></SelectTrigger>
                  <SelectContent>
                    {oficinas.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Matricular</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as oficinas</SelectItem>
                {oficinas.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{matriculas.length} matrícula(s)</span>
          </div>
        </CardHeader>
        <CardContent>
          {matriculas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma matrícula encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.aluno_nome}</TableCell>
                    <TableCell>{m.oficina_nome}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[m.status]}>{statusLabels[m.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
