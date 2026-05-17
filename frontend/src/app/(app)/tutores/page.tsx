"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";

interface Tutor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  area_atuacao: string | null;
}

const emptyForm = { nome: "", email: "", telefone: "", area_atuacao: "" };

export default function TutoresPage() {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api.get<Tutor[]>("/tutores").then(setTutores).catch(() => toast.error("Erro ao carregar tutores"));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/tutores/${editId}`, form);
        toast.success("Tutor atualizado");
      } else {
        await api.post("/tutores", form);
        toast.success("Tutor cadastrado");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (tutor: Tutor) => {
    setForm({
      nome: tutor.nome,
      email: tutor.email || "",
      telefone: tutor.telefone || "",
      area_atuacao: tutor.area_atuacao || "",
    });
    setEditId(tutor.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este tutor?")) return;
    try {
      await api.delete(`/tutores/${id}`);
      toast.success("Tutor removido");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tutores</h1>
          <p className="text-muted-foreground">Gerencie os tutores e monitores das oficinas</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo tutor
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Editar tutor" : "Novo tutor"}</DialogTitle>
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
              <div className="space-y-2">
                <Label>Área de atuação</Label>
                <Input placeholder="Ex: Programação Web, Lógica, Robótica" value={form.area_atuacao} onChange={(e) => setForm({ ...form, area_atuacao: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">{editId ? "Salvar" : "Cadastrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {tutores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum tutor cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutores.map((tutor) => (
                  <TableRow key={tutor.id}>
                    <TableCell className="font-medium">{tutor.nome}</TableCell>
                    <TableCell>{tutor.email || "—"}</TableCell>
                    <TableCell>{tutor.telefone || "—"}</TableCell>
                    <TableCell>{tutor.area_atuacao || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tutor)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tutor.id)}>
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
