"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { CheckSquare, Plus, Calculator } from "lucide-react";

interface Oficina { id: string; nome: string; }
interface Aula { id: string; oficina_id: string; data: string; topico: string | null; }
interface Matricula { id: string; aluno_id: string; aluno_nome: string; oficina_id: string; }
interface Presenca { matricula_id: string; presente: boolean; }
interface Stats { matricula_id: string; aluno_nome: string; total_aulas: number; presencas: number; percentual_presenca: number; }

export default function PresencaPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "professor" || user?.role === "tutor";
  const searchParams = useSearchParams();
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [selectedOficina, setSelectedOficina] = useState("");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [selectedAula, setSelectedAula] = useState("");
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<Stats[]>([]);
  const [novaAulaOpen, setNovaAulaOpen] = useState(false);
  const [novaAulaForm, setNovaAulaForm] = useState({ data: new Date().toISOString().split("T")[0], topico: "" });

  useEffect(() => {
    api.get<Oficina[]>("/oficinas").then((data) => {
      setOficinas(data);
      const fromUrl = searchParams.get("oficina");
      if (fromUrl && data.some((o) => o.id === fromUrl)) {
        setSelectedOficina(fromUrl);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedOficina) return;
    api.get<Aula[]>(`/aulas?oficina_id=${selectedOficina}`).then(setAulas).catch(() => {});
    api.get<Matricula[]>(`/matriculas?oficina_id=${selectedOficina}`).then(setMatriculas).catch(() => {});
    api.get<Stats[]>(`/presencas/stats?oficina_id=${selectedOficina}`).then(setStats).catch(() => {});
    setSelectedAula("");
  }, [selectedOficina]);

  useEffect(() => {
    if (!selectedAula) { setPresencas({}); return; }
    api.get<Presenca[]>(`/presencas?aula_id=${selectedAula}`).then((data) => {
      const map: Record<string, boolean> = {};
      data.forEach((p) => { map[p.matricula_id] = p.presente; });
      setPresencas(map);
    }).catch(() => {});
  }, [selectedAula]);

  const togglePresenca = async (matriculaId: string, presente: boolean) => {
    try {
      await api.post("/presencas/toggle", { matricula_id: matriculaId, aula_id: selectedAula, presente });
      setPresencas((prev) => ({ ...prev, [matriculaId]: presente }));
      api.get<Stats[]>(`/presencas/stats?oficina_id=${selectedOficina}`).then(setStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const criarAula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const aula = await api.post<Aula>("/aulas", { oficina_id: selectedOficina, ...novaAulaForm });
      setAulas((prev) => [...prev, aula]);
      setSelectedAula(aula.id);
      setNovaAulaOpen(false);
      setNovaAulaForm({ data: new Date().toISOString().split("T")[0], topico: "" });
      toast.success("Aula criada");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const recalcular = async () => {
    try {
      const result = await api.post<{ aprovados: number; reprovados: number }>("/presencas/recalcular", { oficina_id: selectedOficina });
      toast.success(`Aprovação recalculada: ${result.aprovados} aprovados, ${result.reprovados} reprovados`);
      api.get<Stats[]>(`/presencas/stats?oficina_id=${selectedOficina}`).then(setStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (d: string) => {
    const dateStr = d.includes("T") ? d.split("T")[0] : d;
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Presença</h1>
        <p className="text-muted-foreground">Registre a presença dos alunos por aula</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 w-full sm:flex-1 sm:min-w-[200px]">
              <Label>Oficina</Label>
              <Select value={selectedOficina} onValueChange={(v) => setSelectedOficina(v || "")}>
                <SelectTrigger>
                  <span className="truncate">{oficinas.find((o) => o.id === selectedOficina)?.nome || "Selecione a oficina..."}</span>
                </SelectTrigger>
                <SelectContent>
                  {oficinas.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOficina && (
              <div className="space-y-2 w-full sm:flex-1 sm:min-w-[200px]">
                <Label>Aula</Label>
                <Select value={selectedAula} onValueChange={(v) => setSelectedAula(v || "")}>
                  <SelectTrigger>
                    <span className="truncate">
                      {aulas.find((a) => a.id === selectedAula)
                        ? `${formatDate(aulas.find((a) => a.id === selectedAula)!.data)}${aulas.find((a) => a.id === selectedAula)!.topico ? ` — ${aulas.find((a) => a.id === selectedAula)!.topico}` : ""}`
                        : "Selecione a aula..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {aulas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {formatDate(a.data)} {a.topico ? `— ${a.topico}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedOficina && canManage && (
              <>
                <Button variant="outline" onClick={() => setNovaAulaOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova aula
                </Button>
                <Dialog open={novaAulaOpen} onOpenChange={setNovaAulaOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova aula</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={criarAula} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Data *</Label>
                        <Input type="date" value={novaAulaForm.data} onChange={(e) => setNovaAulaForm({ ...novaAulaForm, data: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Topico</Label>
                        <Input placeholder="Ex: Logica condicional" value={novaAulaForm.topico} onChange={(e) => setNovaAulaForm({ ...novaAulaForm, topico: e.target.value })} />
                      </div>
                      <Button type="submit" className="w-full">Criar aula</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedOficina && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista de presença</CardTitle>
                <CardDescription>
                  {selectedAula ? "Marque os alunos presentes" : "Selecione uma aula para registrar presença"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedAula ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione ou crie uma aula</p>
                  </div>
                ) : matriculas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum aluno matriculado nesta oficina</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matriculas.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={presencas[m.id] || false}
                            onCheckedChange={(checked) => togglePresenca(m.id, !!checked)}
                          />
                          <span className="font-medium">{m.aluno_nome}</span>
                        </div>
                        <Badge variant={presencas[m.id] ? "default" : "outline"}>
                          {presencas[m.id] ? "Presente" : "Ausente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequência da turma</CardTitle>
                <CardDescription>Aprovação: 75% de presença</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem dados ainda</p>
                ) : (
                  <>
                    {stats.map((s) => (
                      <div key={s.matricula_id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate">{s.aluno_nome}</span>
                          <span className={s.percentual_presenca >= 75 ? "text-green-600" : "text-red-500"}>
                            {s.percentual_presenca}%
                          </span>
                        </div>
                        <Progress value={s.percentual_presenca}>
                          <ProgressTrack>
                            <ProgressIndicator className={s.percentual_presenca >= 75 ? "bg-green-500" : "bg-red-400"} />
                          </ProgressTrack>
                        </Progress>
                        <p className="text-xs text-muted-foreground">{s.presencas} / {s.total_aulas} aulas</p>
                      </div>
                    ))}
                    {canManage && (
                      <Button variant="outline" className="w-full mt-4" onClick={recalcular}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Recalcular aprovacao
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
