import React, { createContext, useContext, useMemo, useReducer, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Tipos de domínio
// ---------------------------------------------------------------------------

export type CurrencyCode = "BRL" | "USD" | "EUR" | "GBP"

export interface Wallet {
  id: string
  name: string
  currency: CurrencyCode
  color: string
  icon: string
}

export type TxKind = "receita" | "despesa"

export interface Transaction {
  id: string
  kind: TxKind
  amount: number // sempre positivo, na moeda da carteira
  walletId: string
  category: string
  description: string
  tags: string[]
  date: string // ISO yyyy-mm-dd
  archived?: boolean
  /** id de agrupamento para transferências internas (não contam como receita/despesa) */
  transferId?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  custom?: boolean
  keywords: string[]
}

// ---------------------------------------------------------------------------
// Utilidades de moeda
// ---------------------------------------------------------------------------

export const currencyMeta: Record<CurrencyCode, { symbol: string; label: string; locale: string }> = {
  BRL: { symbol: "R$", label: "Real brasileiro", locale: "pt-BR" },
  USD: { symbol: "US$", label: "Dólar americano", locale: "en-US" },
  EUR: { symbol: "€", label: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", label: "Libra esterlina", locale: "en-GB" },
}

// Taxas fictícias relativas ao BRL (1 unidade da moeda = X BRL)
export const ratesToBRL: Record<CurrencyCode, number> = {
  BRL: 1,
  USD: 5.42,
  EUR: 5.87,
  GBP: 6.83,
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount
  return (amount * ratesToBRL[from]) / ratesToBRL[to]
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const { locale } = currencyMeta[currency]
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// ---------------------------------------------------------------------------
// Dados fictícios coerentes
// ---------------------------------------------------------------------------

export const seedCategories: Category[] = [
  { id: "c-alimentacao", name: "Alimentação", icon: "restaurant", keywords: ["mercado", "restaurante", "ifood", "padaria", "almoço", "lanche", "supermercado"] },
  { id: "c-transporte", name: "Transporte", icon: "commute", keywords: ["uber", "99", "gasolina", "ônibus", "metrô", "combustível", "estacionamento"] },
  { id: "c-moradia", name: "Moradia", icon: "home", keywords: ["aluguel", "condomínio", "luz", "água", "internet", "gás"] },
  { id: "c-lazer", name: "Lazer", icon: "sports_esports", keywords: ["cinema", "show", "netflix", "spotify", "jogo", "viagem"] },
  { id: "c-saude", name: "Saúde", icon: "favorite", keywords: ["farmácia", "consulta", "remédio", "academia", "dentista"] },
  { id: "c-salario", name: "Salário", icon: "payments", keywords: ["salário", "pagamento", "pró-labore"] },
  { id: "c-freela", name: "Freelance", icon: "work", keywords: ["freela", "projeto", "cliente", "extra"] },
  { id: "c-outros", name: "Outros", icon: "category", keywords: [] },
]

export const seedWallets: Wallet[] = [
  { id: "w-nubank", name: "Conta Nubank", currency: "BRL", color: "#8A05BE", icon: "account_balance" },
  { id: "w-carteira", name: "Dinheiro", currency: "BRL", color: "#1560d4", icon: "wallet" },
  { id: "w-viagem", name: "Reserva Viagem", currency: "USD", color: "#386663", icon: "flight" },
  { id: "w-euro", name: "Conta Euro", currency: "EUR", color: "#b56a00", icon: "savings" },
]

function daysAgo(n: number): string {
  const d = new Date("2026-09-13T12:00:00")
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const seedTransactions: Transaction[] = [
  { id: "t1", kind: "receita", amount: 6800, walletId: "w-nubank", category: "Salário", description: "Salário mensal — Setembro", tags: ["fixo"], date: daysAgo(8) },
  { id: "t2", kind: "despesa", amount: 2200, walletId: "w-nubank", category: "Moradia", description: "Aluguel apartamento", tags: ["fixo", "casa"], date: daysAgo(7) },
  { id: "t3", kind: "despesa", amount: 486.9, walletId: "w-nubank", category: "Alimentação", description: "Supermercado Pão de Açúcar", tags: ["casa"], date: daysAgo(6) },
  { id: "t4", kind: "despesa", amount: 52.4, walletId: "w-carteira", category: "Transporte", description: "Uber para o trabalho", tags: [], date: daysAgo(5) },
  { id: "t5", kind: "despesa", amount: 39.9, walletId: "w-nubank", category: "Lazer", description: "Assinatura Netflix", tags: ["assinatura"], date: daysAgo(5) },
  { id: "t6", kind: "receita", amount: 1500, walletId: "w-nubank", category: "Freelance", description: "Projeto site cliente Aurora", tags: ["extra"], date: daysAgo(4) },
  { id: "t7", kind: "despesa", amount: 128.5, walletId: "w-carteira", category: "Alimentação", description: "Almoço com equipe", tags: ["trabalho"], date: daysAgo(3) },
  { id: "t8", kind: "despesa", amount: 89.9, walletId: "w-nubank", category: "Saúde", description: "Farmácia Drogasil", tags: [], date: daysAgo(2) },
  { id: "t9", kind: "despesa", amount: 42, walletId: "w-viagem", category: "Lazer", description: "Museum ticket — NYC", tags: ["viagem"], date: daysAgo(2) },
  { id: "t10", kind: "receita", amount: 300, walletId: "w-euro", category: "Outros", description: "Reembolso hotel", tags: ["viagem"], date: daysAgo(1) },
  { id: "t11", kind: "despesa", amount: 67.3, walletId: "w-nubank", category: "Transporte", description: "Gasolina posto Shell", tags: ["carro"], date: daysAgo(1) },
  { id: "t12", kind: "despesa", amount: 24.9, walletId: "w-carteira", category: "Alimentação", description: "Padaria da esquina", tags: [], date: daysAgo(0) },
]

// ---------------------------------------------------------------------------
// Estado e reducer
// ---------------------------------------------------------------------------

interface State {
  wallets: Wallet[]
  transactions: Transaction[]
  categories: Category[]
  mainCurrency: CurrencyCode
}

type Action =
  | { type: "add-tx"; tx: Transaction }
  | { type: "update-tx"; tx: Transaction }
  | { type: "delete-tx"; id: string }
  | { type: "archive-tx"; id: string; archived: boolean }
  | { type: "add-wallet"; wallet: Wallet }
  | { type: "add-category"; category: Category }
  | { type: "transfer"; fromId: string; toId: string; amount: number; converted: number; date: string; note: string }
  | { type: "set-main-currency"; currency: CurrencyCode }
  | { type: "restore"; state: State }

const initialState: State = {
  wallets: seedWallets,
  transactions: seedTransactions,
  categories: seedCategories,
  mainCurrency: "BRL",
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add-tx":
      return { ...state, transactions: [action.tx, ...state.transactions] }
    case "update-tx":
      return { ...state, transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)) }
    case "delete-tx":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) }
    case "archive-tx":
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.id ? { ...t, archived: action.archived } : t)),
      }
    case "add-wallet":
      return { ...state, wallets: [...state.wallets, action.wallet] }
    case "add-category":
      return { ...state, categories: [...state.categories, action.category] }
    case "transfer": {
      const tid = "tr-" + Math.random().toString(36).slice(2, 8)
      const out: Transaction = {
        id: tid + "-o", kind: "despesa", amount: action.amount, walletId: action.fromId,
        category: "Transferência", description: action.note || "Transferência entre carteiras", tags: ["transferência"], date: action.date, transferId: tid,
      }
      const inc: Transaction = {
        id: tid + "-i", kind: "receita", amount: action.converted, walletId: action.toId,
        category: "Transferência", description: action.note || "Transferência entre carteiras", tags: ["transferência"], date: action.date, transferId: tid,
      }
      return { ...state, transactions: [out, inc, ...state.transactions] }
    }
    case "set-main-currency":
      return { ...state, mainCurrency: action.currency }
    case "restore":
      return action.state
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Saldos — alterações nas transações atualizam os saldos
// Transferências internas não contam como receita/despesa nos totais.
// ---------------------------------------------------------------------------

export function walletBalance(state: State, walletId: string): number {
  const seed = seedBalance(walletId)
  return state.transactions
    .filter((t) => t.walletId === walletId && !t.archived)
    .reduce((acc, t) => acc + (t.kind === "receita" ? t.amount : -t.amount), seed)
}

// saldo inicial fictício por carteira (para dar corpo aos valores)
function seedBalance(walletId: string): number {
  const map: Record<string, number> = { "w-nubank": 1240, "w-carteira": 180, "w-viagem": 950, "w-euro": 420 }
  return map[walletId] ?? 0
}

export function monthlyTotals(state: State, month: string) {
  let receita = 0
  let despesa = 0
  for (const t of state.transactions) {
    if (t.archived) continue
    if (t.transferId) continue // transferências não entram em receitas/despesas
    if (!t.date.startsWith(month)) continue
    const inBRL = convert(t.amount, walletCurrency(state, t.walletId), state.mainCurrency)
    if (t.kind === "receita") receita += inBRL
    else despesa += inBRL
  }
  return { receita, despesa, saldo: receita - despesa }
}

export function walletCurrency(state: State, walletId: string): CurrencyCode {
  return state.wallets.find((w) => w.id === walletId)?.currency ?? "BRL"
}

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

interface StoreCtx {
  state: State
  dispatch: React.Dispatch<Action>
  // undo do último editar/excluir
  pushUndo: (label: string, prev: State) => void
  undo: () => void
  undoLabel: string | null
  clearUndo: () => void
  maintenance: boolean
  setMaintenance: (v: boolean) => void
}

const Ctx = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [undoLabel, setUndoLabel] = useState<string | null>(null)
  const [maintenance, setMaintenance] = useState(false)
  const undoSnapshot = useRef<State | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pushUndo = (label: string, prev: State) => {
    undoSnapshot.current = prev
    setUndoLabel(label)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndoLabel(null), 6000)
  }
  const undo = () => {
    if (undoSnapshot.current) dispatch({ type: "restore", state: undoSnapshot.current })
    setUndoLabel(null)
  }
  const clearUndo = () => setUndoLabel(null)

  const value = useMemo(
    () => ({ state, dispatch, pushUndo, undo, undoLabel, clearUndo, maintenance, setMaintenance }),
    [state, undoLabel, maintenance],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useStore fora do StoreProvider")
  return c
}
