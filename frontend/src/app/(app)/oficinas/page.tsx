"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, BookOpen, Calendar, Users, Trash2 } from "lucide-react";

interface Tutor {
  id: string;
  nome: string;
}

interface Oficina {
  id: string;
  nome: string;
  descricao: string | null;
  professor_id: string | null;
  professor_nome: string | null;
  tutores: Tutor[];
  data_inicio: string | null;
  data_fim: string | null;
  vagas: number;
  status: string;
}

interface Profile {
  id: string;
  nome: string;
  email: string;
}

const statusLabels: Record<string, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planejada: "secondary",
  em_andamento: "default",
  concluida: "outline",
  cancelada: "destructive",
};

const emptyForm = {
  nome: "",
  descricao: "",
  professor_id: "",
  tutor_ids: [] as string[],
  data_inicio: "",
  data_fim: "",
  vagas: "20",
  status: "planejada",
};

export default function OficinasPage() {
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    api.get<Oficina[]>("/oficinas").then(setOficinas).catch(() => toast.error("Erro ao carregar oficinas"));
    api.get<Profile[]>("/users").then(setProfiles).catch(() => {});
    api.get<Tutor[]>("/tutores").then(setTutores).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, vagas: parseInt(form.vagas) };
    try {
      if (editId) {
        await api.put(`/oficinas/${editId}`, data);
        toast.success("Oficina atualizada");
      } else {
        await api.post("/oficinas", data);
        toast.success("Oficina criada");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toDateInput = (d: string | null) => {
    if (!d) return "";
    return d.includes("T") ? d.split("T")[0] : d;
  };

  const handleEdit = (oficina: Oficina) => {
    setForm({
      nome: oficina.nome,
      descricao: oficina.descricao || "",
      professor_id: oficina.professor_id || "",
      tutor_ids: oficina.tutores.map((t) => t.id),
      data_inicio: toDateInput(oficina.data_inicio),
      data_fim: toDateInput(oficina.data_fim),
      vagas: String(oficina.vagas),
      status: oficina.status,
    });
    setEditId(oficina.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta oficina? Todas as aulas, matrículas e presenças serão apagadas.")) return;
    try {
      await api.delete(`/oficinas/${id}`);
      toast.success("Oficina removida");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const dateStr = d.includes("T") ? d.split("T")[0] : d;
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Oficinas</h1>
          <p className="text-muted-foreground">Gerencie as oficinas do projeto ELLP</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova oficina
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar oficina" : "Nova oficina"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} maxLength={1000} />
              </div>
              <div className="space-y-2">
                <Label>Professor responsável *</Label>
                <Select value={form.professor_id} onValueChange={(v) => setForm({ ...form, professor_id: v || "" })}>
                  <SelectTrigger>
                    <span className="truncate">{profiles.find((p) => p.id === form.professor_id)?.nome || "Selecione..."}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tutores.length > 0 && (
                <div className="space-y-2">
                  <Label>Tutores</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-3 max-h-32 overflow-y-auto">
                    {tutores.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.tutor_ids.includes(t.id)}
                          onCheckedChange={(checked) => {
                            setForm((prev) => ({
                              ...prev,
                              tutor_ids: checked
                                ? [...prev.tutor_ids, t.id]
                                : prev.tutor_ids.filter((id) => id !== t.id),
                            }));
                          }}
                        />
                        {t.nome}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v || "planejada" })}>
                    <SelectTrigger>
                      <span className="truncate">{statusLabels[form.status] || "Planejada"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vagas</Label>
                  <Input type="number" min={1} max={500} value={form.vagas} onChange={(e) => setForm({ ...form, vagas: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de início</Label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data de fim</Label>
                  <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editId ? "Salvar" : "Criar oficina"}</Button>
                {editId && (
                  <Button type="button" variant="destructive" onClick={() => { setOpen(false); handleDelete(editId); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {oficinas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma oficina cadastrada</p>
            <p className="text-sm">Crie a primeira oficina para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {oficinas.map((oficina) => (
            <Card key={oficina.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{oficina.nome}</CardTitle>
                  <Badge variant={statusVariants[oficina.status]}>{statusLabels[oficina.status]}</Badge>
                </div>
                {oficina.descricao && <CardDescription className="line-clamp-2">{oficina.descricao}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Professor: {oficina.professor_nome || "—"}</span>
                </div>
                {oficina.tutores.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Tutores: {oficina.tutores.map((t) => t.nome).join(", ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(oficina.data_inicio)} — {formatDate(oficina.data_fim)}</span>
                </div>
                <p className="text-muted-foreground">{oficina.vagas} vagas</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(oficina)}>Editar</Button>
                  <Link href={`/presenca?oficina=${oficina.id}`}>
                    <Button variant="outline" size="sm">Presença</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
