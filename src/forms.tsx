import React, { useEffect, useMemo, useState } from "react"
import { Button, Card, Chip, Dialog, Icon, IconButton, Sheet, TextField, SegmentedControl } from "./ui"
import {
  Category, CurrencyCode, Transaction, Wallet, convert, currencyMeta, formatMoney, useStore, walletBalance, walletCurrency,
} from "./store"

const today = "2026-09-13"

function suggestCategory(desc: string, categories: Category[]): string | null {
  const d = desc.toLowerCase()
  for (const c of categories) {
    if (c.keywords.some((k) => d.includes(k))) return c.name
  }
  return null
}

// ---------------------------------------------------------------------------
// Formulário de transação (registrar / editar / duplicar) + entrada por voz
// ---------------------------------------------------------------------------

export function TransactionForm({
  open,
  onClose,
  editing,
  onSaved,
  defaultKind = "despesa",
}: {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
  onSaved: (msg: string) => void
  defaultKind?: "receita" | "despesa"
}) {
  const { state, dispatch, pushUndo, maintenance } = useStore()
  const [kind, setKind] = useState<"receita" | "despesa">(defaultKind)
  const [amount, setAmount] = useState("")
  const [walletId, setWalletId] = useState(state.wallets[0].id)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [date, setDate] = useState(today)
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [voice, setVoice] = useState<"idle" | "listening" | "review">("idle")

  useEffect(() => {
    if (!open) return
    if (editing) {
      setKind(editing.kind)
      setAmount(String(editing.amount))
      setWalletId(editing.walletId)
      setCategory(editing.category)
      setDescription(editing.description)
      setTags(editing.tags)
      setDate(editing.date)
    } else {
      setKind(defaultKind)
      setAmount("")
      setWalletId(state.wallets[0].id)
      setCategory("")
      setDescription("")
      setTags([])
      setDate(today)
    }
    setVoice("idle")
  }, [open, editing])

  const suggested = useMemo(() => (description && !category ? suggestCategory(description, state.categories) : null), [description, category, state.categories])
  const wallet = state.wallets.find((w) => w.id === walletId)!

  const salvar = () => {
    const value = parseFloat(amount.replace(",", "."))
    if (!value || !category) return
    const tx: Transaction = {
      id: editing ? editing.id : "t-" + Math.random().toString(36).slice(2, 9),
      kind,
      amount: value,
      walletId,
      category,
      description: description || category,
      tags,
      date,
      archived: editing?.archived,
    }
    if (editing) {
      pushUndo("Transação editada", state)
      dispatch({ type: "update-tx", tx })
      onSaved("Transação atualizada")
    } else {
      dispatch({ type: "add-tx", tx })
      onSaved("Transação registrada")
    }
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "")
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput("")
  }

  // simulação de entrada por voz
  const startVoice = () => {
    setVoice("listening")
    setTimeout(() => {
      setKind("despesa")
      setAmount("47,90")
      setDescription("Almoço no restaurante japonês")
      setCategory("Alimentação")
      setDate(today)
      setVoice("review")
    }, 2200)
  }

  const title = editing ? "Editar transação" : "Nova transação"

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {maintenance && !editing && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container text-on-error-container px-3 py-2.5 mt-3 text-[13px]">
          <Icon name="engineering" className="text-[18px]" />
          Operações de registro estão suspensas durante a manutenção.
        </div>
      )}

      {voice === "listening" && (
        <div className="flex flex-col items-center py-10 om-fade">
          <div className="relative w-24 h-24 flex items-center justify-center mb-4">
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Icon name="mic" className="text-[36px] text-on-primary" fill />
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">Ouvindo… fale o valor e a descrição</p>
          <div className="flex items-end gap-1 h-8 mt-4">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="w-1.5 bg-primary rounded-full" style={{ height: "100%", animation: `om-wave 0.8s ${i * 0.09}s ease-in-out infinite` }} />
            ))}
          </div>
          <Button variant="text" className="mt-6" onClick={() => setVoice("idle")}>Cancelar</Button>
        </div>
      )}

      {voice !== "listening" && (
        <div className="flex flex-col gap-4 pt-3">
          {voice === "review" && (
            <div className="flex items-start gap-2 rounded-xl bg-tertiary-container text-on-tertiary-container px-3 py-2.5 text-[13px]">
              <Icon name="reviews" className="text-[18px]" />
              <span>Reconhecemos por voz: <b>"Almoço no restaurante japonês, R$ 47,90"</b>. Revise antes de salvar.</span>
            </div>
          )}

          <SegmentedControl
            value={kind}
            onChange={(v) => setKind(v)}
            options={[{ value: "despesa", label: "Despesa" }, { value: "receita", label: "Receita" }]}
          />

          <div className={`rounded-2xl px-4 py-3 ${kind === "receita" ? "bg-primary-container" : "bg-error-container"}`}>
            <span className={`text-[11px] font-medium ${kind === "receita" ? "text-on-primary-container" : "text-on-error-container"}`}>
              Valor ({currencyMeta[wallet.currency].symbol})
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg ${kind === "receita" ? "text-on-primary-container" : "text-on-error-container"}`}>{currencyMeta[wallet.currency].symbol}</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className={`bg-transparent outline-none font-mono text-3xl w-full ${kind === "receita" ? "text-on-primary-container placeholder:text-on-primary-container/40" : "text-on-error-container placeholder:text-on-error-container/40"}`}
              />
            </div>
          </div>

          <TextField label="Descrição" value={description} onChange={setDescription} icon="notes" placeholder="Ex.: Supermercado, Uber…" />

          {suggested && (
            <button onClick={() => setCategory(suggested)} className="state-layer flex items-center gap-2 self-start rounded-full bg-secondary-container text-on-secondary-container px-3 py-1.5 text-[13px] -mt-1">
              <Icon name="auto_awesome" className="text-[16px]" />
              Sugestão: {suggested}
            </button>
          )}

          <div>
            <span className="text-[11px] font-medium text-on-surface-variant px-1">Carteira</span>
            <div className="flex gap-2 overflow-x-auto py-2">
              {state.wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWalletId(w.id)}
                  className={`state-layer flex items-center gap-2 shrink-0 rounded-xl border px-3 h-11 ${walletId === w.id ? "border-primary bg-primary-container/40" : "border-outline-variant"}`}
                >
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: w.color }}>
                    <Icon name={w.icon} className="text-[15px] text-white" />
                  </span>
                  <span className="text-[13px] text-on-surface">{w.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-on-surface-variant">Categoria</span>
              <button onClick={() => setNewCatOpen(true)} className="text-[12px] text-primary font-medium flex items-center gap-1">
                <Icon name="add" className="text-[15px]" /> Nova
              </button>
            </div>
            <div className="flex flex-wrap gap-2 py-2">
              {state.categories.filter((c) => c.name !== "Transferência").map((c) => (
                <Chip key={c.id} icon={c.icon} selected={category === c.name} onClick={() => setCategory(c.name)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>

          <TextField label="Data" value={date} onChange={setDate} icon="event" type="date" />

          <div>
            <span className="text-[11px] font-medium text-on-surface-variant px-1">Tags</span>
            <div className="flex flex-wrap items-center gap-2 py-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-surface-variant text-on-surface-variant px-2.5 h-8 text-[13px]">
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <Icon name="close" className="text-[15px]" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="+ tag"
                className="bg-transparent outline-none text-[13px] text-on-surface h-8 w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {voice === "idle" && !editing && (
              <IconButton name="mic" onClick={startVoice} className="border border-outline !text-primary" aria-label="Registrar por voz" />
            )}
            <Button variant="text" onClick={onClose} className="ml-auto">Cancelar</Button>
            <Button onClick={salvar} disabled={!amount || !category || (maintenance && !editing)} icon="check">
              Salvar
            </Button>
          </div>
        </div>
      )}

      <NewCategoryDialog open={newCatOpen} onClose={() => setNewCatOpen(false)} onCreate={(c) => { setCategory(c.name); setNewCatOpen(false) }} />
    </Sheet>
  )
}

function NewCategoryDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (c: Category) => void }) {
  const { dispatch } = useStore()
  const [name, setName] = useState("")
  const icons = ["category", "shopping_bag", "school", "pets", "child_care", "fitness_center", "local_bar", "redeem"]
  const [icon, setIcon] = useState(icons[0])
  useEffect(() => { if (open) { setName(""); setIcon(icons[0]) } }, [open])
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nova categoria"
      icon="new_label"
      actions={
        <>
          <Button variant="text" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const c: Category = { id: "c-" + Math.random().toString(36).slice(2, 7), name: name.trim(), icon, custom: true, keywords: [name.trim().toLowerCase()] }
              dispatch({ type: "add-category", category: c })
              onCreate(c)
            }}
          >
            Criar
          </Button>
        </>
      }
    >
      <div className="text-left flex flex-col gap-3">
        <TextField label="Nome da categoria" value={name} onChange={setName} placeholder="Ex.: Educação" />
        <div className="flex flex-wrap gap-2 justify-center">
          {icons.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)} className={`w-11 h-11 rounded-xl flex items-center justify-center border ${icon === ic ? "border-primary bg-primary-container/40" : "border-outline-variant"}`}>
              <Icon name={ic} className="text-[20px] text-on-surface-variant" />
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Transferência entre carteiras (não conta como receita/despesa)
// ---------------------------------------------------------------------------

export function TransferForm({ open, onClose, onSaved, fromWalletId }: { open: boolean; onClose: () => void; onSaved: (m: string) => void; fromWalletId?: string }) {
  const { state, dispatch, maintenance } = useStore()
  const [fromId, setFromId] = useState(fromWalletId ?? state.wallets[0].id)
  const [toId, setToId] = useState(state.wallets[1].id)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) {
      setFromId(fromWalletId ?? state.wallets[0].id)
      setToId(state.wallets.find((w) => w.id !== (fromWalletId ?? state.wallets[0].id))!.id)
      setAmount("")
      setNote("")
    }
  }, [open, fromWalletId])

  const from = state.wallets.find((w) => w.id === fromId)!
  const to = state.wallets.find((w) => w.id === toId)!
  const value = parseFloat(amount.replace(",", ".")) || 0
  const converted = convert(value, from.currency, to.currency)
  const diffCurrency = from.currency !== to.currency

  const transferir = () => {
    if (!value || fromId === toId) return
    dispatch({ type: "transfer", fromId, toId, amount: value, converted, date: today, note })
    onSaved("Transferência realizada")
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Transferir entre carteiras">
      <div className="flex flex-col gap-4 pt-3">
        <WalletPicker label="De" wallets={state.wallets} value={fromId} onChange={setFromId} exclude={toId} />
        <div className="flex justify-center -my-2">
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
            <Icon name="south" className="text-[20px] text-on-secondary-container" />
          </div>
        </div>
        <WalletPicker label="Para" wallets={state.wallets} value={toId} onChange={setToId} exclude={fromId} />

        <div className="rounded-2xl bg-surface-variant px-4 py-3">
          <span className="text-[11px] font-medium text-on-surface-variant">Valor a transferir ({currencyMeta[from.currency].symbol})</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg text-on-surface">{currencyMeta[from.currency].symbol}</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" className="bg-transparent outline-none font-mono text-3xl w-full text-on-surface placeholder:text-on-surface/30" />
          </div>
        </div>

        {diffCurrency && value > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-tertiary-container text-on-tertiary-container px-3 py-2.5 text-[13px]">
            <Icon name="currency_exchange" className="text-[18px]" />
            <span>Conversão: {formatMoney(value, from.currency)} → <b>{formatMoney(converted, to.currency)}</b> <span className="opacity-70">(taxa fictícia)</span></span>
          </div>
        )}

        <TextField label="Observação (opcional)" value={note} onChange={setNote} icon="edit_note" placeholder="Ex.: Reserva mensal" />

        <div className="flex items-center gap-2 rounded-xl bg-surface-variant/60 px-3 py-2 text-[12px] text-on-surface-variant">
          <Icon name="info" className="text-[16px]" />
          Transferências internas não contam como receitas ou despesas.
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="text" onClick={onClose}>Cancelar</Button>
          <Button onClick={transferir} disabled={!value || fromId === toId || maintenance} icon="swap_horiz">Transferir</Button>
        </div>
      </div>
    </Sheet>
  )
}

function WalletPicker({ label, wallets, value, onChange, exclude }: { label: string; wallets: Wallet[]; value: string; onChange: (v: string) => void; exclude?: string }) {
  return (
    <div>
      <span className="text-[11px] font-medium text-on-surface-variant px-1">{label}</span>
      <div className="flex gap-2 overflow-x-auto py-2">
        {wallets.filter((w) => w.id !== exclude).map((w) => (
          <button key={w.id} onClick={() => onChange(w.id)} className={`state-layer flex items-center gap-2 shrink-0 rounded-xl border px-3 h-11 ${value === w.id ? "border-primary bg-primary-container/40" : "border-outline-variant"}`}>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: w.color }}>
              <Icon name={w.icon} className="text-[15px] text-white" />
            </span>
            <span className="text-[13px] text-on-surface">{w.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nova carteira
// ---------------------------------------------------------------------------

export function WalletForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (m: string) => void }) {
  const { dispatch } = useStore()
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>("BRL")
  const colors = ["#1560d4", "#00629e", "#35618e", "#5b3fbe", "#8A05BE", "#006874"]
  const iconsList = ["account_balance", "wallet", "savings", "flight", "credit_card", "paid"]
  const [color, setColor] = useState(colors[0])
  const [icon, setIcon] = useState(iconsList[0])
  useEffect(() => { if (open) { setName(""); setCurrency("BRL"); setColor(colors[0]); setIcon(iconsList[0]) } }, [open])

  return (
    <Sheet open={open} onClose={onClose} title="Nova carteira">
      <div className="flex flex-col gap-4 pt-3">
        <TextField label="Nome da carteira" value={name} onChange={setName} icon="badge" placeholder="Ex.: Conta corrente" />
        <div>
          <span className="text-[11px] font-medium text-on-surface-variant px-1">Moeda</span>
          <div className="flex flex-wrap gap-2 py-2">
            {(Object.keys(currencyMeta) as CurrencyCode[]).map((c) => (
              <Chip key={c} selected={currency === c} onClick={() => setCurrency(c)}>
                {currencyMeta[c].symbol} {c}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-on-surface-variant px-1">Cor</span>
          <div className="flex gap-2 py-2">
            {colors.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`w-9 h-9 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-primary ring-offset-surface" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-medium text-on-surface-variant px-1">Ícone</span>
          <div className="flex flex-wrap gap-2 py-2">
            {iconsList.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} className={`w-11 h-11 rounded-xl flex items-center justify-center border ${icon === ic ? "border-primary bg-primary-container/40" : "border-outline-variant"}`}>
                <Icon name={ic} className="text-[20px] text-on-surface-variant" />
              </button>
            ))}
          </div>
        </div>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color }}>
            <Icon name={icon} className="text-[22px] text-white" />
          </span>
          <div>
            <p className="text-sm font-medium text-on-surface">{name || "Prévia da carteira"}</p>
            <p className="text-[12px] text-on-surface-variant">{currencyMeta[currency].label}</p>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="text" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!name.trim()}
            icon="check"
            onClick={() => {
              dispatch({ type: "add-wallet", wallet: { id: "w-" + Math.random().toString(36).slice(2, 7), name: name.trim(), currency, color, icon } })
              onSaved("Carteira criada")
              onClose()
            }}
          >
            Criar carteira
          </Button>
        </div>
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Detalhes da transação: editar, duplicar, excluir, arquivar
// ---------------------------------------------------------------------------

export function TxDetails({ tx, onClose, onEdit, onToast }: { tx: Transaction | null; onClose: () => void; onEdit: (t: Transaction) => void; onToast: (m: string) => void }) {
  const { state, dispatch, pushUndo } = useStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!tx) return null
  const wallet = state.wallets.find((w) => w.id === tx.walletId)!
  const isTransfer = !!tx.transferId

  const duplicate = () => {
    const copy: Transaction = { ...tx, id: "t-" + Math.random().toString(36).slice(2, 9), description: tx.description + " (cópia)", transferId: undefined }
    dispatch({ type: "add-tx", tx: copy })
    onToast("Transação duplicada")
    onClose()
  }
  const archive = () => {
    dispatch({ type: "archive-tx", id: tx.id, archived: !tx.archived })
    onToast(tx.archived ? "Transação restaurada" : "Transação arquivada")
    onClose()
  }
  const remove = () => {
    pushUndo("Transação excluída", state)
    dispatch({ type: "delete-tx", id: tx.id })
    setConfirmDelete(false)
    onToast("Transação excluída")
    onClose()
  }

  return (
    <Sheet open={!!tx} onClose={onClose} title="Detalhes da transação">
      <div className="flex flex-col gap-4 pt-3">
        <div className="flex flex-col items-center py-2">
          <span className={`text-[13px] font-medium mb-1 ${tx.kind === "receita" ? "text-primary" : "text-error"}`}>
            {isTransfer ? "Transferência" : tx.kind === "receita" ? "Receita" : "Despesa"}
          </span>
          <span className={`font-mono text-4xl ${tx.kind === "receita" ? "text-primary" : "text-on-surface"}`}>
            {tx.kind === "receita" ? "+" : "−"}{formatMoney(tx.amount, wallet.currency)}
          </span>
          {tx.archived && <span className="mt-2 inline-flex items-center gap-1 text-[12px] text-on-surface-variant bg-surface-variant rounded-full px-2 py-0.5"><Icon name="inventory_2" className="text-[14px]" />Arquivada</span>}
        </div>

        <div className="rounded-2xl border border-outline-variant divide-y divide-outline-variant">
          <DetailRow icon="notes" label="Descrição" value={tx.description} />
          <DetailRow icon="event" label="Data" value={new Date(tx.date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
          <DetailRow icon={wallet.icon} label="Carteira" value={`${wallet.name} · ${wallet.currency}`} />
          <DetailRow icon="sell" label="Categoria" value={tx.category} />
          {tx.tags.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Icon name="tag" className="text-[20px] text-on-surface-variant" />
              <div className="flex flex-wrap gap-1.5">
                {tx.tags.map((t) => (
                  <span key={t} className="rounded-lg bg-surface-variant px-2 py-0.5 text-[12px] text-on-surface-variant">#{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isTransfer ? (
          <div className="flex items-center gap-2 rounded-xl bg-surface-variant/60 px-3 py-2 text-[12px] text-on-surface-variant">
            <Icon name="info" className="text-[16px]" />
            Parte de uma transferência interna — não afeta receitas ou despesas.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="tonal" icon="edit" onClick={() => onEdit(tx)}>Editar</Button>
            <Button variant="tonal" icon="content_copy" onClick={duplicate}>Duplicar</Button>
            <Button variant="outlined" icon={tx.archived ? "unarchive" : "inventory_2"} onClick={archive}>{tx.archived ? "Restaurar" : "Arquivar"}</Button>
            <Button variant="outlined" icon="delete" className="!text-error !border-error/50" onClick={() => setConfirmDelete(true)}>Excluir</Button>
          </div>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir transação?"
        icon="delete"
        actions={
          <>
            <Button variant="text" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button className="!bg-error !text-on-error" onClick={remove}>Excluir</Button>
          </>
        }
      >
        Esta ação pode ser desfeita logo após a exclusão. Deseja continuar?
      </Dialog>
    </Sheet>
  )
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon name={icon} className="text-[20px] text-on-surface-variant" />
      <div className="min-w-0">
        <p className="text-[11px] text-on-surface-variant">{label}</p>
        <p className="text-sm text-on-surface truncate">{value}</p>
      </div>
    </div>
  )
}

export { suggestCategory, today, walletBalance, walletCurrency }
