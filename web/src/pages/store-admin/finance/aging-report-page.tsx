import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import apiClient from "@/services/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Receivable {
  id: string;
  clientName: string;
  totalAmount: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
  dueDate?: string;
  daysOverdue: number;
  isOverdue: boolean;
  description?: string;
}

interface AgingBucket {
  label: string;
  range: string;
  color: string;
  bgColor: string;
  accounts: Receivable[];
  total: number;
}

export default function AgingReportPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [accounts, setAccounts] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/accounts-receivable", {
          params: { storeId, pending: true },
        });
        setAccounts(Array.isArray(res.data) ? res.data : []);
      } catch {
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [storeId]);

  const buckets: AgingBucket[] = useMemo(() => {
    const today = new Date();
    const todayDateOnly = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    const b = [
      {
        label: "Vigente",
        range: "Aún no vence",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50 border-emerald-200",
        accounts: [] as Receivable[],
        total: 0,
      },
      {
        label: "Vence hoy",
        range: "Atención inmediata",
        color: "text-sky-700",
        bgColor: "bg-sky-50 border-sky-200",
        accounts: [] as Receivable[],
        total: 0,
      },
      {
        label: "1-7 días",
        range: "Vencida reciente",
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-200",
        accounts: [] as Receivable[],
        total: 0,
      },
      {
        label: "8-30 días",
        range: "Vencida prioritaria",
        color: "text-orange-700",
        bgColor: "bg-orange-50 border-orange-200",
        accounts: [] as Receivable[],
        total: 0,
      },
      {
        label: "+30 días",
        range: "Vencida crítica",
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-200",
        accounts: [] as Receivable[],
        total: 0,
      },
    ];

    accounts.forEach((a) => {
      const days = Number(a.daysOverdue || 0);
      const amt = a.remainingAmount || 0;
      const dueToday =
        !!a.dueDate && days === 0 && a.dueDate.slice(0, 10) === todayDateOnly;
      if (!a.isOverdue && !dueToday) {
        b[0].accounts.push(a);
        b[0].total += amt;
      } else if (dueToday) {
        b[1].accounts.push(a);
        b[1].total += amt;
      } else if (days <= 7) {
        b[2].accounts.push(a);
        b[2].total += amt;
      } else if (days <= 30) {
        b[3].accounts.push(a);
        b[3].total += amt;
      } else {
        b[4].accounts.push(a);
        b[4].total += amt;
      }
    });

    return b;
  }, [accounts]);

  const grandTotal = buckets.reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-rose-900 to-orange-800 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit border border-white/20 bg-white/10 text-white hover:bg-white/10">
              <CalendarClock className="h-3 w-3 mr-1" /> Antigüedad
            </Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight">
                Aging de Cartera
              </h1>
              <p className="text-sm text-white/70">
                Análisis de antigüedad de cuentas por cobrar pendientes.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {buckets.map((b) => (
              <div
                key={b.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                  {b.label}
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  C$ {b.total.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/40">
                  {b.accounts.length} cuenta(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOTAL BAR */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-black text-lg">Total Cartera Pendiente</p>
              <p className="text-sm text-muted-foreground">
                {accounts.length} cuentas activas
              </p>
            </div>
          </div>
          <p className="text-3xl font-black">C$ {grandTotal.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* PROGRESS BAR */}
      {grandTotal > 0 && (
        <div className="flex h-4 w-full overflow-hidden rounded-full">
          {buckets.map((b) => {
            const pct = (b.total / grandTotal) * 100;
            if (pct === 0) return null;
            const colors: Record<string, string> = {
              Vigente: "bg-emerald-500",
              "Vence hoy": "bg-sky-500",
              "1-7 días": "bg-amber-500",
              "8-30 días": "bg-orange-500",
              "+30 días": "bg-red-500",
            };
            return (
              <div
                key={b.label}
                className={`${colors[b.label] || "bg-gray-300"} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${b.label}: C$ ${b.total.toFixed(2)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* BUCKET DETAILS */
        <div className="space-y-4">
          {buckets.map((bucket) => (
            <Card
              key={bucket.label}
              className={`rounded-2xl border ${bucket.bgColor}`}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-lg font-black ${bucket.color}`}>
                      {bucket.label}
                    </CardTitle>
                    <CardDescription>
                      {bucket.range} — {bucket.accounts.length} cuenta(s)
                    </CardDescription>
                  </div>
                  <p className={`text-2xl font-black ${bucket.color}`}>
                    C$ {bucket.total.toFixed(2)}
                  </p>
                </div>
              </CardHeader>
              {bucket.accounts.length > 0 && (
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">
                          Total Original
                        </TableHead>
                        <TableHead className="text-right">
                          Saldo Pendiente
                        </TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="text-right">
                          Días vencida
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bucket.accounts.map((a) => {
                        const days = Number(a.daysOverdue || 0);
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.clientName || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              C$ {a.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              C$ {a.remainingAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.dueDate
                                ? new Date(a.dueDate).toLocaleDateString(
                                    "es-NI",
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  days > 30
                                    ? "destructive"
                                    : days > 7
                                      ? "default"
                                      : "secondary"
                                }
                                className="font-mono"
                              >
                                {days}d
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
