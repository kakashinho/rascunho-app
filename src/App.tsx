import React, { useEffect, useState } from "react"
import { StoreProvider, Transaction, useStore } from "./store"
import { FAB, Icon, IconButton, Snackbar } from "./ui"
import Auth from "./Auth"
import { TransactionForm, TransferForm, WalletForm, TxDetails } from "./forms"
import { HomeScreen, WalletsScreen, TransactionsScreen, PreferencesScreen } from "./screens"

type Tab = "inicio" | "transacoes" | "carteiras" | "preferencias"

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "inicio", label: "Início", icon: "home" },
  { id: "transacoes", label: "Transações", icon: "receipt_long" },
  { id: "carteiras", label: "Carteiras", icon: "account_balance_wallet" },
  { id: "preferencias", label: "Preferências", icon: "settings" },
]

function PhoneStatusBar() {
  return (
    <div
      className="relative shrink-0 bg-black text-white flex items-center justify-between px-6 text-[12px] font-medium"
      style={{ height: "calc(env(safe-area-inset-top, 0px) + 34px)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <span className="font-mono tracking-tight">9:41</span>
      {/* câmera (punch-hole) */}
      <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#1a1a1a] ring-1 ring-white/10" />
      <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#0b2a4a]" />
      <span className="flex items-center gap-1.5">
        <Icon name="signal_cellular_alt" className="text-[15px]" />
        <Icon name="wifi" className="text-[15px]" />
        <Icon name="battery_full" className="text-[15px]" />
      </span>
    </div>
  )
}

export default function App() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <StoreProvider>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e5dc] dark:bg-[#0c0b09] p-0 sm:p-6">
        {/* Moldura de smartphone; em telas largas simula um aparelho */}
        <div className="relative w-full h-[100dvh] sm:h-[860px] sm:max-w-[420px] bg-background sm:rounded-[44px] sm:border-[10px] sm:border-[#0c0b09] sm:shadow-2xl overflow-hidden flex flex-col">
          <PhoneStatusBar />
          <div className="flex-1 min-h-0">
            <Shell dark={dark} setDark={setDark} />
          </div>
        </div>
      </div>
    </StoreProvider>
  )
}

function Shell({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const { undoLabel, undo, clearUndo } = useStore()
  const [authed, setAuthed] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [tab, setTab] = useState<Tab>("inicio")
  const [loading, setLoading] = useState(true)

  // sheets
  const [txFormOpen, setTxFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferFrom, setTransferFrom] = useState<string | undefined>()
  const [walletFormOpen, setWalletFormOpen] = useState(false)
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)

  // feedback
  const [toast, setToast] = useState<string | null>(null)
  const [confirmAnim, setConfirmAnim] = useState<string | null>(null)

  // simula carregamento inicial dos dados
  useEffect(() => {
    if (!authed) return
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 1100)
    return () => clearTimeout(t)
  }, [authed])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast((cur) => (cur === m ? null : cur)), 3500) }

  const onSaved = (msg: string) => {
    if (msg === "Transação registrada" || msg === "Transferência realizada") {
      setConfirmAnim(msg)
      setTimeout(() => setConfirmAnim(null), 1500)
    } else {
      showToast(msg)
    }
  }

  const openNewTx = () => { setEditing(null); setTxFormOpen(true) }
  const openTransfer = (walletId?: string) => { setTransferFrom(walletId); setTransferOpen(true) }
  const editFromDetails = (t: Transaction) => { setDetailTx(null); setEditing(t); setTxFormOpen(true) }

  if (!authed) {
    return <Auth onAuthenticated={() => { setAuthed(true); setSessionExpired(false) }} sessionExpired={sessionExpired} />
  }

  return (
    <div className="relative h-full flex flex-col bg-background">
      {/* App bar */}
      <header className="flex items-center justify-between px-4 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Icon name="savings" className="text-[18px] text-on-primary" fill />
          </span>
          <span className="text-[15px] font-medium text-on-surface">Orçamento Fácil</span>
        </div>
        <div className="flex items-center">
          <IconButton name={dark ? "light_mode" : "dark_mode"} onClick={() => setDark(!dark)} aria-label="Alternar tema" />
          <IconButton name="logout" onClick={() => { setAuthed(false); setSessionExpired(true); setTab("inicio") }} aria-label="Sair (simula sessão expirada)" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto om-fade" key={tab}>
        {tab === "inicio" && <HomeScreen loading={loading} onNewTx={openNewTx} onTransfer={openTransfer} onOpenTx={setDetailTx} onGoWallets={() => setTab("carteiras")} />}
        {tab === "transacoes" && <TransactionsScreen loading={loading} onOpenTx={setDetailTx} />}
        {tab === "carteiras" && <WalletsScreen onNewWallet={() => setWalletFormOpen(true)} onTransfer={openTransfer} />}
        {tab === "preferencias" && <PreferencesScreen dark={dark} onToggleDark={setDark} />}
      </main>

      {/* FAB */}
      {(tab === "inicio" || tab === "transacoes") && (
        <div className="absolute right-4 bottom-24 z-30">
          <FAB icon="add" label="Registrar" onClick={openNewTx} />
        </div>
      )}

      {/* Navegação inferior */}
      <nav className="shrink-0 flex items-stretch h-20 bg-surface-variant/60 backdrop-blur border-t border-outline-variant/40 px-2">
        {tabs.map((t) => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 flex flex-col items-center justify-center gap-1 pt-2">
              <span className={`flex items-center justify-center h-8 w-16 rounded-full transition-colors ${active ? "bg-secondary-container" : ""}`}>
                <Icon name={t.icon} className={`text-[22px] ${active ? "text-on-secondary-container" : "text-on-surface-variant"}`} fill={active} />
              </span>
              <span className={`text-[11px] ${active ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>{t.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Sheets / dialogs */}
      <TransactionForm open={txFormOpen} editing={editing} onClose={() => setTxFormOpen(false)} onSaved={onSaved} />
      <TransferForm open={transferOpen} fromWalletId={transferFrom} onClose={() => setTransferOpen(false)} onSaved={onSaved} />
      <WalletForm open={walletFormOpen} onClose={() => setWalletFormOpen(false)} onSaved={showToast} />
      <TxDetails tx={detailTx} onClose={() => setDetailTx(null)} onEdit={editFromDetails} onToast={showToast} />

      {/* Undo snackbar */}
      {undoLabel && <Snackbar label={undoLabel} actionLabel="Desfazer" onAction={undo} onClose={clearUndo} />}
      {toast && !undoLabel && <Snackbar label={toast} onClose={() => setToast(null)} />}

      {/* Confirmação animada */}
      {confirmAnim && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 om-scrim">
          <div className="bg-surface rounded-[28px] px-10 py-8 flex flex-col items-center om-pop">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path className="om-check" d="M4 12.5l5 5L20 6.5" stroke="var(--on-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-base font-medium text-on-surface mt-4">{confirmAnim}!</p>
            <p className="text-[12px] text-on-surface-variant">Saldos atualizados</p>
          </div>
        </div>
      )}
    </div>
  )
}
