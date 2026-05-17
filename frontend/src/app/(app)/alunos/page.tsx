"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";

interface Aluno {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  ra: string | null;
  data_nascimento: string | null;
  observacoes: string | null;
}

const emptyForm = { nome: "", email: "", telefone: "", ra: "", data_nascimento: "", observacoes: "" };

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api.get<Aluno[]>("/alunos").then(setAlunos).catch(() => toast.error("Erro ao carregar alunos"));

  useEffect(() => { load(); }, []);

  const filtered = alunos.filter((a) => {
    const q = search.toLowerCase();
    return a.nome.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.ra?.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/alunos/${editId}`, form);
        toast.success("Aluno atualizado");
      } else {
        await api.post("/alunos", form);
        toast.success("Aluno cadastrado");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (aluno: Aluno) => {
    setForm({
      nome: aluno.nome,
      email: aluno.email || "",
      telefone: aluno.telefone || "",
      ra: aluno.ra || "",
      data_nascimento: aluno.data_nascimento || "",
      observacoes: aluno.observacoes || "",
    });
    setEditId(aluno.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este aluno? Todas as matrículas e presenças serão apagadas.")) return;
    try {
      await api.delete(`/alunos/${id}`);
      toast.success("Aluno removido");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Gerencie os alunos cadastrados no sistema</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo aluno
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar aluno" : "Novo aluno"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RA / Matrícula</Label>
                  <Input value={form.ra} onChange={(e) => setForm({ ...form, ra: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} maxLength={1000} />
              </div>
              <Button type="submit" className="w-full">{editId ? "Salvar" : "Cadastrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, email ou RA..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">{filtered.length} aluno(s)</span>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum aluno encontrado</p>
              <p className="text-sm">Cadastre o primeiro aluno para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>RA</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>{aluno.email || "—"}</TableCell>
                    <TableCell>{aluno.telefone || "—"}</TableCell>
                    <TableCell>{aluno.ra || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(aluno)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(aluno.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
