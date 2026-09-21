import React, { useMemo, useState } from "react"
import { Button, Card, Chip, Icon, IconButton, Skeleton, EmptyState, SegmentedControl, Dialog, Switch, Sheet } from "./ui"
import {
  CurrencyCode, Transaction, convert, currencyMeta, formatMoney, monthlyTotals, ratesToBRL, useStore, walletBalance, walletCurrency,
} from "./store"

const catIcon: Record<string, string> = {
  Alimentação: "restaurant", Transporte: "commute", Moradia: "home", Lazer: "sports_esports",
  Saúde: "favorite", Salário: "payments", Freelance: "work", Outros: "category", Transferência: "swap_horiz",
}

// --- Peças reutilizáveis de filtro (padronizadas nas três telas) ----------

function FilterToolbar({ label, active, onOpen }: { label: string; active: number; onOpen: () => void }) {
  return (
    <div className="px-5 pt-3">
      <button onClick={onOpen} className="state-layer w-full flex items-center gap-2.5 h-12 rounded-full bg-surface-variant px-4 text-left">
        <Icon name="tune" className="text-[20px] text-on-surface-variant" />
        <span className="flex-1 text-sm text-on-surface truncate capitalize">{label}</span>
        {active > 0 && <span className="text-[11px] font-medium bg-primary text-on-primary rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">{active}</span>}
        <Icon name="expand_more" className="text-[20px] text-on-surface-variant" />
      </button>
    </div>
  )
}

function SheetSection({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[13px] font-medium text-on-surface">{label}</span>
      {hint && <p className="text-[12px] text-on-surface-variant">{hint}</p>}
      <div className="pt-2">{children}</div>
    </div>
  )
}

function DateRangeFields({ from, to, setFrom, setTo }: { from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="rounded-xl border border-outline px-3 py-2">
        <span className="text-[11px] text-on-surface-variant">De</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent outline-none text-sm text-on-surface w-full" />
      </label>
      <label className="rounded-xl border border-outline px-3 py-2">
        <span className="text-[11px] text-on-surface-variant">Até</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent outline-none text-sm text-on-surface w-full" />
      </label>
    </div>
  )
}

function SheetActions({ onClear, onApply }: { onClear: () => void; onApply: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="text" onClick={onClear}>Limpar</Button>
      <Button onClick={onApply}>Aplicar</Button>
    </div>
  )
}

function prettyDate(d: string) {
  return new Date(d + "T12:00").toLocaleDateString("pt-BR")
}

function TxRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const { state } = useStore()
  const cur = walletCurrency(state, tx.walletId)
  const wallet = state.wallets.find((w) => w.id === tx.walletId)
  const isTransfer = !!tx.transferId
  return (
    <button onClick={onClick} className="state-layer w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left">
      <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-surface-variant">
        <Icon name={catIcon[tx.category] ?? "category"} className="text-[22px] text-on-surface-variant" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface truncate flex items-center gap-1.5">
          {tx.description}
          {tx.archived && <Icon name="inventory_2" className="text-[14px] text-on-surface-variant" />}
        </p>
        <p className="text-[12px] text-on-surface-variant truncate">{tx.category} · {wallet?.name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-mono text-sm ${isTransfer ? "text-on-surface-variant" : tx.kind === "receita" ? "text-primary" : "text-on-surface"}`}>
          {tx.kind === "receita" ? "+" : "−"}{formatMoney(tx.amount, cur)}
        </p>
        <p className="text-[11px] text-on-surface-variant">{new Date(tx.date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------------

export function HomeScreen({ onNewTx, onTransfer, onOpenTx, onGoWallets, loading }: {
  onNewTx: () => void; onTransfer: (walletId?: string) => void; onOpenTx: (t: Transaction) => void; onGoWallets: () => void; loading: boolean
}) {
  const { state, maintenance } = useStore()
  const month = "2026-09"
  const totals = monthlyTotals(state, month)
  const recent = state.transactions.filter((t) => !t.archived).slice(0, 4)

  const totalInMain = state.wallets.reduce((acc, w) => acc + convert(walletBalance(state, w.id), w.currency, state.mainCurrency), 0)

  return (
    <div className="pb-28">
      <div className="px-5 pt-3">
        <p className="text-sm text-on-surface-variant">Olá, João 👋</p>
        <h1 className="text-2xl font-normal text-on-surface">Suas finanças</h1>
      </div>

      {maintenance && (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-2xl bg-error-container text-on-error-container px-4 py-3 text-[13px] om-fade">
          <Icon name="engineering" className="text-[20px]" />
          <div><b>Manutenção em andamento.</b> Consultas seguem disponíveis; registros e transferências estão temporariamente bloqueados.</div>
        </div>
      )}

      {/* Patrimônio consolidado */}
      <div className="px-5 pt-4">
        <div className="p-5 rounded-3xl bg-primary text-on-primary">
          <p className="text-[13px] text-on-primary/80">Patrimônio total ({state.mainCurrency})</p>
          {loading ? <Skeleton className="h-9 w-40 mt-2 bg-on-primary/30" /> : (
            <p className="font-mono text-3xl mt-1 text-on-primary">{formatMoney(totalInMain, state.mainCurrency)}</p>
          )}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <p className="text-[11px] text-on-primary/70 flex items-center gap-1"><Icon name="south_west" className="text-[14px]" />Receitas (mês)</p>
              <p className="font-mono text-sm mt-0.5 text-on-primary">{formatMoney(totals.receita, state.mainCurrency)}</p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-on-primary/70 flex items-center gap-1"><Icon name="north_east" className="text-[14px]" />Despesas (mês)</p>
              <p className="font-mono text-sm mt-0.5 text-on-primary">{formatMoney(totals.despesa, state.mainCurrency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos */}
      <div className="px-5 pt-4 grid grid-cols-2 gap-3">
        <button onClick={onNewTx} className="state-layer flex items-center gap-3 rounded-2xl bg-secondary-container text-on-secondary-container px-4 py-4">
          <Icon name="add_circle" className="text-[26px]" fill />
          <span className="text-sm font-medium text-left leading-tight">Registrar<br />transação</span>
        </button>
        <button onClick={() => onTransfer()} className="state-layer flex items-center gap-3 rounded-2xl bg-tertiary-container text-on-tertiary-container px-4 py-4">
          <Icon name="swap_horiz" className="text-[26px]" fill />
          <span className="text-sm font-medium text-left leading-tight">Transferir<br />valores</span>
        </button>
      </div>

      {/* Carteiras */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <h2 className="text-base font-medium text-on-surface">Carteiras</h2>
        <button onClick={onGoWallets} className="text-[13px] text-primary font-medium">Ver todas</button>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 py-3">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-44 shrink-0" />)
          : state.wallets.map((w) => {
              const bal = walletBalance(state, w.id)
              return (
                <button key={w.id} onClick={() => onTransfer(w.id)} className="state-layer shrink-0 w-44 text-left rounded-3xl border border-outline-variant/60 bg-surface p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: w.color }}>
                      <Icon name={w.icon} className="text-[18px] text-white" />
                    </span>
                    <span className="text-[11px] font-medium text-on-surface-variant bg-surface-variant rounded-full px-2 py-0.5">{w.currency}</span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant truncate">{w.name}</p>
                  <p className={`font-mono text-lg ${bal < 0 ? "text-error" : "text-on-surface"}`}>{formatMoney(bal, w.currency)}</p>
                </button>
              )
            })}
      </div>

      {/* Recentes */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <h2 className="text-base font-medium text-on-surface">Atividade recente</h2>
      </div>
      <div className="px-1 pt-1">
        {loading
          ? [0, 1, 2].map((i) => <div key={i} className="flex items-center gap-3 px-4 py-3"><Skeleton className="w-11 h-11 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-32 mb-1.5" /><Skeleton className="h-3 w-20" /></div></div>)
          : recent.map((t) => <TxRow key={t.id} tx={t} onClick={() => onOpenTx(t)} />)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Carteiras
// ---------------------------------------------------------------------------

export function WalletsScreen({ onNewWallet, onTransfer }: { onNewWallet: () => void; onTransfer: (id?: string) => void }) {
  const { state } = useStore()
  const [convOpen, setConvOpen] = useState(false)

  return (
    <div className="pb-28">
      <div className="px-5 pt-3 flex items-center justify-between">
        <h1 className="text-2xl font-normal text-on-surface">Carteiras</h1>
        <Button variant="tonal" icon="currency_exchange" onClick={() => setConvOpen(true)}>Converter</Button>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3">
        {state.wallets.map((w) => {
          const bal = walletBalance(state, w.id)
          return (
            <Card key={w.id} className="p-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: w.color }}>
                  <Icon name={w.icon} className="text-[24px] text-white" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{w.name}</p>
                  <p className="text-[12px] text-on-surface-variant">{currencyMeta[w.currency].label}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-lg ${bal < 0 ? "text-error" : "text-on-surface"}`}>{formatMoney(bal, w.currency)}</p>
                  <p className="text-[11px] text-on-surface-variant">≈ {formatMoney(convert(bal, w.currency, state.mainCurrency), state.mainCurrency)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant/60">
                <Button variant="text" icon="swap_horiz" onClick={() => onTransfer(w.id)} className="flex-1">Transferir</Button>
              </div>
            </Card>
          )
        })}

        <button onClick={onNewWallet} className="state-layer flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-outline-variant py-5 text-on-surface-variant">
          <Icon name="add" className="text-[22px]" />
          <span className="text-sm font-medium">Criar nova carteira</span>
        </button>
      </div>

      <ConverterDialog open={convOpen} onClose={() => setConvOpen(false)} />
    </div>
  )
}

function ConverterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState("100")
  const [from, setFrom] = useState<CurrencyCode>("BRL")
  const [to, setTo] = useState<CurrencyCode>("USD")
  const value = parseFloat(amount.replace(",", ".")) || 0
  const result = convert(value, from, to)
  return (
    <Dialog open={open} onClose={onClose} title="Conversor de moedas" icon="currency_exchange" actions={<Button onClick={onClose}>Fechar</Button>}>
      <div className="text-left flex flex-col gap-3">
        <div className="rounded-xl border border-outline px-3 py-2">
          <span className="text-[11px] text-on-surface-variant">Valor</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="bg-transparent outline-none font-mono text-xl w-full text-on-surface" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["from", "to"] as const).map((k) => (
            <div key={k}>
              <span className="text-[11px] text-on-surface-variant px-1">{k === "from" ? "De" : "Para"}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(Object.keys(currencyMeta) as CurrencyCode[]).map((c) => (
                  <Chip key={c} selected={(k === "from" ? from : to) === c} onClick={() => (k === "from" ? setFrom(c) : setTo(c))}>{c}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-primary-container text-on-primary-container px-4 py-3 text-center">
          <p className="text-[12px]">{formatMoney(value, from)} equivale a</p>
          <p className="font-mono text-2xl mt-0.5">{formatMoney(result, to)}</p>
        </div>
        <p className="text-[11px] text-on-surface-variant text-center">Taxas fictícias · 1 {from} = {(ratesToBRL[from] / ratesToBRL[to]).toFixed(4)} {to}</p>
      </div>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Transações: Histórico · Fluxo de caixa · Extrato
// ---------------------------------------------------------------------------

type SortKey = "date" | "amount" | "category"

export function TransactionsScreen({ onOpenTx, loading }: { onOpenTx: (t: Transaction) => void; loading: boolean }) {
  const [tab, setTab] = useState<"historico" | "fluxo" | "extrato">("historico")
  return (
    <div className="pb-28">
      <div className="px-5 pt-3">
        <h1 className="text-2xl font-normal text-on-surface mb-3">Transações</h1>
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v)}
          options={[{ value: "historico", label: "Histórico" }, { value: "fluxo", label: "Fluxo" }, { value: "extrato", label: "Extrato" }]}
        />
      </div>
      {tab === "historico" && <History onOpenTx={onOpenTx} loading={loading} />}
      {tab === "fluxo" && <CashFlow onOpenTx={onOpenTx} />}
      {tab === "extrato" && <Extrato />}
    </div>
  )
}

function History({ onOpenTx, loading }: { onOpenTx: (t: Transaction) => void; loading: boolean }) {
  const { state } = useStore()
  const [query, setQuery] = useState("")
  const [month, setMonth] = useState("2026-09")
  const [cats, setCats] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>("date")
  const [asc, setAsc] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [visible, setVisible] = useState(6)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const useRange = !!(dateFrom || dateTo)
  const allCats = Array.from(new Set(state.transactions.map((t) => t.category)))

  const filtered = useMemo(() => {
    let list = state.transactions.filter((t) => (showArchived ? true : !t.archived))
    if (useRange) {
      if (dateFrom) list = list.filter((t) => t.date >= dateFrom)
      if (dateTo) list = list.filter((t) => t.date <= dateTo)
    } else {
      list = list.filter((t) => t.date.startsWith(month))
    }
    if (query) list = list.filter((t) => t.description.toLowerCase().includes(query.toLowerCase()))
    if (cats.length) list = list.filter((t) => cats.includes(t.category))
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sort === "date") cmp = a.date.localeCompare(b.date)
      else if (sort === "amount") cmp = convert(a.amount, walletCurrency(state, a.walletId), state.mainCurrency) - convert(b.amount, walletCurrency(state, b.walletId), state.mainCurrency)
      else cmp = a.category.localeCompare(b.category)
      return asc ? cmp : -cmp
    })
    return list
  }, [state, query, month, cats, sort, asc, showArchived, dateFrom, dateTo, useRange])

  const shown = filtered.slice(0, visible)
  const monthLabel = new Date(month + "-01T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const shiftMonth = (delta: number) => {
    const d = new Date(month + "-01T12:00")
    d.setMonth(d.getMonth() + delta)
    setMonth(d.toISOString().slice(0, 7))
    setVisible(6)
  }

  return (
    <div className="pt-3">
      {/* busca */}
      <div className="px-5">
        <div className="flex items-center gap-2 h-12 rounded-full bg-surface-variant px-4">
          <Icon name="search" className="text-[20px] text-on-surface-variant" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setVisible(6) }} placeholder="Buscar por descrição" className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant" />
          {query && <IconButton name="close" onClick={() => setQuery("")} className="!w-8 !h-8" />}
          <IconButton name="tune" onClick={() => setFiltersOpen(true)} className="!w-8 !h-8" aria-label="Filtros" />
        </div>
      </div>

      {/* navegação mensal (desativada quando há intervalo de datas) */}
      {useRange ? (
        <div className="px-5 pt-3 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-on-surface bg-secondary-container text-on-secondary-container rounded-full px-3 py-1.5">
            <Icon name="date_range" className="text-[16px]" />
            {dateFrom ? new Date(dateFrom + "T12:00").toLocaleDateString("pt-BR") : "início"} — {dateTo ? new Date(dateTo + "T12:00").toLocaleDateString("pt-BR") : "hoje"}
          </span>
        </div>
      ) : (
        <div className="px-5 pt-3 flex items-center justify-between">
          <IconButton name="chevron_left" onClick={() => shiftMonth(-1)} aria-label="Mês anterior" />
          <span className="text-sm font-medium text-on-surface capitalize">{monthLabel}</span>
          <IconButton name="chevron_right" onClick={() => shiftMonth(1)} aria-label="Próximo mês" />
        </div>
      )}

      {/* ordenação */}
      <div className="px-5 pt-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[12px] text-on-surface-variant shrink-0">Ordenar:</span>
        {([["date", "Data"], ["amount", "Valor"], ["category", "Categoria"]] as [SortKey, string][]).map(([k, l]) => (
          <button key={k} onClick={() => (sort === k ? setAsc((a) => !a) : (setSort(k), setAsc(false)))} className={`state-layer shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-lg border text-[13px] ${sort === k ? "bg-secondary-container text-on-secondary-container border-transparent" : "border-outline-variant text-on-surface-variant"}`}>
            {l}
            {sort === k && <Icon name={asc ? "arrow_upward" : "arrow_downward"} className="text-[15px]" />}
          </button>
        ))}
      </div>

      {(cats.length > 0 || showArchived || useRange) && (
        <div className="px-5 pt-2 flex flex-wrap gap-2">
          {useRange && <Chip selected onClick={() => { setDateFrom(""); setDateTo(""); setVisible(6) }}>Intervalo de datas</Chip>}
          {cats.map((c) => <Chip key={c} selected onClick={() => setCats(cats.filter((x) => x !== c))}>{c}</Chip>)}
          {showArchived && <Chip selected onClick={() => setShowArchived(false)}>Incluindo arquivadas</Chip>}
        </div>
      )}

      {/* lista */}
      <div className="px-1 pt-3">
        {loading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3 px-4 py-3"><Skeleton className="w-11 h-11 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-40 mb-1.5" /><Skeleton className="h-3 w-24" /></div></div>)
        ) : shown.length === 0 ? (
          <EmptyState icon="receipt_long" title="Nenhuma transação" description="Não há registros para este período ou filtro. Ajuste a busca ou registre uma nova transação." />
        ) : (
          shown.map((t) => <TxRow key={t.id} tx={t} onClick={() => onOpenTx(t)} />)
        )}

        {!loading && visible < filtered.length && (
          <div className="flex justify-center py-4">
            <Button variant="outlined" icon="expand_more" onClick={() => setVisible((v) => v + 6)}>
              Carregar mais ({filtered.length - visible})
            </Button>
          </div>
        )}
        {!loading && shown.length > 0 && visible >= filtered.length && (
          <p className="text-center text-[12px] text-on-surface-variant py-4">Fim do histórico deste período</p>
        )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
        <div className="flex flex-col gap-4 pt-3">
          <SheetSection label="Intervalo de datas" hint="Substitui a navegação mensal enquanto ativo.">
            <DateRangeFields from={dateFrom} to={dateTo} setFrom={(v) => { setDateFrom(v); setVisible(6) }} setTo={(v) => { setDateTo(v); setVisible(6) }} />
          </SheetSection>
          <SheetSection label="Categorias">
            <div className="flex flex-wrap gap-2">
              {allCats.map((c) => <Chip key={c} selected={cats.includes(c)} onClick={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])}>{c}</Chip>)}
            </div>
          </SheetSection>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-on-surface">Mostrar arquivadas</p>
              <p className="text-[12px] text-on-surface-variant">Arquivadas continuam disponíveis para consulta</p>
            </div>
            <Switch checked={showArchived} onChange={setShowArchived} />
          </div>
          <SheetActions onClear={() => { setCats([]); setShowArchived(false); setDateFrom(""); setDateTo("") }} onApply={() => setFiltersOpen(false)} />
        </div>
      </Sheet>
    </div>
  )
}

// Ordem cronológica (fluxo de caixa)
function CashFlow({ onOpenTx }: { onOpenTx: (t: Transaction) => void }) {
  const { state } = useStore()
  const [from, setFrom] = useState("2026-09-01")
  const [to, setTo] = useState("2026-09-13")
  const [wallet, setWallet] = useState<string>("todas")
  const [kind, setKind] = useState<"todas" | "receita" | "despesa">("todas")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const active = (wallet !== "todas" ? 1 : 0) + (kind !== "todas" ? 1 : 0)
  const list = state.transactions
    .filter((t) => !t.archived && t.date >= from && t.date <= to)
    .filter((t) => (wallet === "todas" ? true : t.walletId === wallet))
    .filter((t) => (kind === "todas" ? true : t.kind === kind))
    .sort((a, b) => a.date.localeCompare(b.date))
  let running = 0
  const rows = list.map((t) => {
    if (!t.transferId) running += (t.kind === "receita" ? 1 : -1) * convert(t.amount, walletCurrency(state, t.walletId), state.mainCurrency)
    return { t, running }
  })
  return (
    <div>
      <FilterToolbar label={`${prettyDate(from)} — ${prettyDate(to)}`} active={active} onOpen={() => setFiltersOpen(true)} />

      {active > 0 && (
        <div className="px-5 pt-2 flex flex-wrap gap-2">
          {kind !== "todas" && <Chip selected onClick={() => setKind("todas")}>{kind === "receita" ? "Receitas" : "Despesas"}</Chip>}
          {wallet !== "todas" && <Chip selected onClick={() => setWallet("todas")}>{state.wallets.find((w) => w.id === wallet)?.name}</Chip>}
        </div>
      )}

      <div className="px-5 pt-3">
        <p className="text-[13px] text-on-surface-variant mb-1">Movimentações em ordem cronológica, com saldo acumulado em {state.mainCurrency}.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="timeline" title="Sem movimentações" description="Nenhuma transação corresponde aos filtros deste período." />
      ) : (
      <div className="relative pl-6 mx-5 mt-2">
        <span className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-outline-variant" />
        {rows.map(({ t, running }) => {
          const cur = walletCurrency(state, t.walletId)
          return (
            <button key={t.id} onClick={() => onOpenTx(t)} className="state-layer relative w-full text-left flex items-center gap-3 py-3 rounded-xl">
              <span className={`absolute -left-[19px] w-3.5 h-3.5 rounded-full border-2 border-surface ${t.transferId ? "bg-outline" : t.kind === "receita" ? "bg-primary" : "bg-error"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface truncate">{t.description}</p>
                <p className="text-[11px] text-on-surface-variant">{new Date(t.date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {t.category}</p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-[13px] ${t.transferId ? "text-on-surface-variant" : t.kind === "receita" ? "text-primary" : "text-on-surface"}`}>{t.kind === "receita" ? "+" : "−"}{formatMoney(t.amount, cur)}</p>
                <p className="font-mono text-[11px] text-on-surface-variant">saldo {formatMoney(running, state.mainCurrency)}</p>
              </div>
            </button>
          )
        })}
      </div>
      )}

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
        <div className="flex flex-col gap-4 pt-3">
          <SheetSection label="Intervalo de datas">
            <DateRangeFields from={from} to={to} setFrom={setFrom} setTo={setTo} />
          </SheetSection>
          <SheetSection label="Tipo">
            <div className="flex flex-wrap gap-2">
              <Chip selected={kind === "todas"} onClick={() => setKind("todas")}>Todas</Chip>
              <Chip selected={kind === "receita"} onClick={() => setKind("receita")}>Receitas</Chip>
              <Chip selected={kind === "despesa"} onClick={() => setKind("despesa")}>Despesas</Chip>
            </div>
          </SheetSection>
          <SheetSection label="Carteira">
            <div className="flex flex-wrap gap-2">
              <Chip selected={wallet === "todas"} onClick={() => setWallet("todas")}>Todas</Chip>
              {state.wallets.map((w) => (
                <Chip key={w.id} selected={wallet === w.id} icon={w.icon} onClick={() => setWallet(w.id)}>{w.name}</Chip>
              ))}
            </div>
          </SheetSection>
          <SheetActions onClear={() => { setKind("todas"); setWallet("todas") }} onApply={() => setFiltersOpen(false)} />
        </div>
      </Sheet>
    </div>
  )
}

// Extrato por período com PDF simulado
function Extrato() {
  const { state } = useStore()
  const [from, setFrom] = useState("2026-09-01")
  const [to, setTo] = useState("2026-09-13")
  const [status, setStatus] = useState<"idle" | "gerando" | "pronto">("idle")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const list = state.transactions.filter((t) => !t.archived && t.date >= from && t.date <= to && !t.transferId)
  const receita = list.filter((t) => t.kind === "receita").reduce((a, t) => a + convert(t.amount, walletCurrency(state, t.walletId), state.mainCurrency), 0)
  const despesa = list.filter((t) => t.kind === "despesa").reduce((a, t) => a + convert(t.amount, walletCurrency(state, t.walletId), state.mainCurrency), 0)

  const gerar = () => {
    setStatus("gerando")
    setTimeout(() => setStatus("pronto"), 1800)
  }

  return (
    <div>
      <FilterToolbar label={`${prettyDate(from)} — ${prettyDate(to)}`} active={0} onOpen={() => setFiltersOpen(true)} />

      <div className="px-5 pt-4 flex flex-col gap-4">
      <p className="text-[13px] text-on-surface-variant">Gere um extrato por período. A geração de PDF é simulada nesta demonstração.</p>

      <Card className="p-4">
        <p className="text-[13px] font-medium text-on-surface mb-3">Resumo do período</p>
        <div className="flex justify-between text-sm py-1"><span className="text-on-surface-variant">Lançamentos</span><span className="font-mono text-on-surface">{list.length}</span></div>
        <div className="flex justify-between text-sm py-1"><span className="text-on-surface-variant">Receitas</span><span className="font-mono text-primary">{formatMoney(receita, state.mainCurrency)}</span></div>
        <div className="flex justify-between text-sm py-1"><span className="text-on-surface-variant">Despesas</span><span className="font-mono text-on-surface">{formatMoney(despesa, state.mainCurrency)}</span></div>
        <div className="flex justify-between text-sm py-1 border-t border-outline-variant/60 mt-1 pt-2"><span className="font-medium text-on-surface">Saldo</span><span className="font-mono font-medium text-on-surface">{formatMoney(receita - despesa, state.mainCurrency)}</span></div>
      </Card>

      {status === "pronto" ? (
        <div className="flex items-center gap-3 rounded-2xl bg-primary-container text-on-primary-container px-4 py-3 om-slide-up">
          <Icon name="picture_as_pdf" className="text-[28px]" fill />
          <div className="flex-1">
            <p className="text-sm font-medium">extrato_{from}_a_{to}.pdf</p>
            <p className="text-[12px] opacity-80">Pronto para download (simulado)</p>
          </div>
          <Icon name="download" className="text-[22px]" />
        </div>
      ) : (
        <Button onClick={gerar} disabled={status === "gerando"} icon={status === "gerando" ? undefined : "picture_as_pdf"} className="w-full">
          {status === "gerando" ? <><span className="inline-block w-5 h-5 border-2 border-on-primary/40 border-t-on-primary rounded-full mr-2" style={{ animation: "om-spin 0.7s linear infinite" }} />Gerando PDF…</> : "Gerar extrato em PDF"}
        </Button>
      )}
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Período do extrato">
        <div className="flex flex-col gap-4 pt-3">
          <SheetSection label="Intervalo de datas">
            <DateRangeFields from={from} to={to} setFrom={(v) => { setFrom(v); setStatus("idle") }} setTo={(v) => { setTo(v); setStatus("idle") }} />
          </SheetSection>
          <SheetActions onClear={() => { setFrom("2026-09-01"); setTo("2026-09-13"); setStatus("idle") }} onApply={() => setFiltersOpen(false)} />
        </div>
      </Sheet>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preferências
// ---------------------------------------------------------------------------

export function PreferencesScreen({ dark, onToggleDark }: { dark: boolean; onToggleDark: (v: boolean) => void }) {
  const { state, dispatch, maintenance, setMaintenance } = useStore()

  return (
    <div className="pb-28">
      <div className="px-5 pt-3">
        <h1 className="text-2xl font-normal text-on-surface">Preferências</h1>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <Card className="p-4">
          <p className="text-[13px] font-medium text-on-surface-variant mb-1">Aparência</p>
          <div className="flex items-center gap-3 py-3">
            <Icon name={dark ? "dark_mode" : "light_mode"} className="text-[22px] text-on-surface-variant" />
            <div className="flex-1">
              <p className="text-sm text-on-surface">Tema escuro</p>
              <p className="text-[12px] text-on-surface-variant">Alterne entre os temas claro e escuro</p>
            </div>
            <Switch checked={dark} onChange={onToggleDark} />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[13px] font-medium text-on-surface-variant mb-2">Moeda principal dos registros</p>
          <p className="text-[12px] text-on-surface-variant mb-3">Usada para consolidar saldos e relatórios entre carteiras.</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(currencyMeta) as CurrencyCode[]).map((c) => (
              <Chip key={c} selected={state.mainCurrency === c} onClick={() => dispatch({ type: "set-main-currency", currency: c })}>
                {currencyMeta[c].symbol} {c}
              </Chip>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[13px] font-medium text-on-surface-variant mb-1">Conta</p>
          {[
            { icon: "person", label: "João Silva", sub: "joao@orcamentofacil.app" },
            { icon: "fingerprint", label: "Biometria", sub: "Ativada neste dispositivo" },
            { icon: "lock", label: "Alterar senha", sub: "Última alteração há 2 meses" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3 py-3">
              <Icon name={r.icon} className="text-[22px] text-on-surface-variant" />
              <div className="flex-1"><p className="text-sm text-on-surface">{r.label}</p><p className="text-[12px] text-on-surface-variant">{r.sub}</p></div>
            </div>
          ))}
        </Card>

        <Card className="p-4">
          <p className="text-[13px] font-medium text-on-surface-variant mb-1">Demonstração</p>
          <div className="flex items-center gap-3 py-3">
            <Icon name="engineering" className="text-[22px] text-on-surface-variant" />
            <div className="flex-1">
              <p className="text-sm text-on-surface">Modo manutenção</p>
              <p className="text-[12px] text-on-surface-variant">Bloqueia operações críticas (registro e transferência)</p>
            </div>
            <Switch checked={maintenance} onChange={setMaintenance} />
          </div>
        </Card>

        <details className="rounded-3xl border border-outline-variant/60 bg-surface px-4 py-3">
          <summary className="text-[13px] font-medium text-on-surface-variant cursor-pointer flex items-center gap-2">
            <Icon name="engineering" className="text-[18px]" /> Anotações técnicas (implementação futura)
          </summary>
          <ul className="text-[12px] text-on-surface-variant mt-3 space-y-1.5 list-disc pl-4">
            <li>App em React Native; API RESTful em Node.js.</li>
            <li>Autenticação com JWT e criptografia de dados sensíveis.</li>
            <li>Logs de auditoria e documentação da API.</li>
            <li>Compressão de dados nas respostas.</li>
            <li>Meta de carregamento inferior a 1s em rede 4G.</li>
            <li>Este protótipo apenas simula a experiência.</li>
          </ul>
        </details>

        <p className="text-center text-[11px] text-on-surface-variant/70 pt-2">Orçamento Fácil · Protótipo v0.1 — primeira entrega</p>
      </div>
    </div>
  )
}
