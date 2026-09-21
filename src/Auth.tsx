import React, { useEffect, useState } from "react"
import { Button, Icon, TextField } from "./ui"

type AuthView = "login" | "cadastro" | "recuperar" | "bloqueado"

const DEMO_EMAIL = "joao@orcamentofacil.app"
const DEMO_SENHA = "123456"
const MAX_TENTATIVAS = 3

export default function Auth({ onAuthenticated, sessionExpired }: { onAuthenticated: () => void; sessionExpired?: boolean }) {
  const [view, setView] = useState<AuthView>("login")
  const [expiredNotice, setExpiredNotice] = useState(!!sessionExpired)

  // login
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [senha, setSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativas, setTentativas] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [bioAtivando, setBioAtivando] = useState(false)

  // cadastro
  const [nome, setNome] = useState("")
  const [cEmail, setCEmail] = useState("")
  const [cSenha, setCSenha] = useState("")
  const [cadOk, setCadOk] = useState(false)

  // recuperação
  const [rEmail, setREmail] = useState("")
  const [enviado, setEnviado] = useState(false)

  const [countdown, setCountdown] = useState(0)
  useEffect(() => {
    if (view !== "bloqueado" || countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [view, countdown])
  useEffect(() => {
    if (view === "bloqueado" && countdown === 0) {
      setView("login")
      setTentativas(0)
      setErro(null)
    }
  }, [countdown, view])

  const entrar = () => {
    setErro(null)
    setExpiredNotice(false)
    setCarregando(true)
    setTimeout(() => {
      setCarregando(false)
      if (email.trim() === DEMO_EMAIL && senha === DEMO_SENHA) {
        onAuthenticated()
        return
      }
      const novas = tentativas + 1
      setTentativas(novas)
      if (novas >= MAX_TENTATIVAS) {
        setCountdown(30)
        setView("bloqueado")
      } else {
        setErro(`Senha inválida. Tentativa ${novas} de ${MAX_TENTATIVAS}.`)
        setSenha("")
      }
    }, 900)
  }

  const biometria = () => {
    setBioAtivando(true)
    setTimeout(() => {
      setBioAtivando(false)
      onAuthenticated()
    }, 1400)
  }

  return (
    <div className="relative h-full w-full bg-background overflow-y-auto">
      {/* topo com marca */}
      <div className="px-7 pt-14 pb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-5">
          <Icon name="savings" className="text-[30px] text-on-primary" fill />
        </div>
        <h1 className="text-[28px] leading-tight font-normal text-on-surface">Orçamento Fácil</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {view === "login" && "Entre para acompanhar suas finanças."}
          {view === "cadastro" && "Crie sua conta em poucos passos."}
          {view === "recuperar" && "Vamos recuperar seu acesso."}
          {view === "bloqueado" && "Acesso temporariamente bloqueado."}
        </p>
      </div>

      <div className="px-7 pb-10">
        {expiredNotice && view === "login" && (
          <div className="flex items-start gap-2 rounded-xl bg-tertiary-container text-on-tertiary-container px-3 py-3 mb-5 text-sm om-fade">
            <Icon name="schedule" className="text-[20px]" />
            <span>Sua sessão expirou por inatividade. Entre novamente para continuar.</span>
          </div>
        )}

        {view === "login" && (
          <div className="flex flex-col gap-4 om-fade">
            <TextField label="E-mail" value={email} onChange={setEmail} icon="mail" type="email" />
            <TextField
              label="Senha"
              value={senha}
              onChange={setSenha}
              icon="lock"
              type={showSenha ? "text" : "password"}
              trailing={showSenha ? "visibility_off" : "visibility"}
              onTrailingClick={() => setShowSenha((s) => !s)}
              error={erro ?? undefined}
              placeholder="••••••"
            />
            <div className="flex justify-end -mt-1">
              <button onClick={() => setView("recuperar")} className="text-sm text-primary font-medium state-layer rounded-lg px-2 py-1">
                Esqueci minha senha
              </button>
            </div>
            <Button onClick={entrar} disabled={carregando || !senha} className="w-full mt-1">
              {carregando ? <Spinner /> : "Entrar"}
            </Button>

            <div className="flex items-center gap-3 my-1">
              <span className="flex-1 h-px bg-outline-variant" />
              <span className="text-xs text-on-surface-variant">ou</span>
              <span className="flex-1 h-px bg-outline-variant" />
            </div>

            <button
              onClick={biometria}
              className="state-layer flex items-center justify-center gap-3 h-12 rounded-full border border-outline text-on-surface"
            >
              {bioAtivando ? (
                <>
                  <Icon name="fingerprint" className="text-[24px] text-primary animate-pulse" />
                  <span className="text-sm">Reconhecendo…</span>
                </>
              ) : (
                <>
                  <Icon name="fingerprint" className="text-[24px] text-primary" />
                  <span className="text-sm font-medium">Entrar com biometria</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-on-surface-variant mt-3">
              Não tem conta?{" "}
              <button onClick={() => setView("cadastro")} className="text-primary font-medium">
                Cadastre-se
              </button>
            </p>
            <p className="text-center text-[11px] text-on-surface-variant/70 mt-2">
              Demonstração — use a senha <span className="font-mono">123456</span>.
            </p>
          </div>
        )}

        {view === "cadastro" && !cadOk && (
          <div className="flex flex-col gap-4 om-fade">
            <TextField label="Nome de usuário" value={nome} onChange={setNome} icon="person" placeholder="ana.silva" />
            <TextField label="E-mail" value={cEmail} onChange={setCEmail} icon="mail" type="email" placeholder="voce@email.com" />
            <TextField label="Senha" value={cSenha} onChange={setCSenha} icon="lock" type="password" placeholder="mínimo 6 caracteres" />
            <PasswordStrength value={cSenha} />
            <Button onClick={() => setCadOk(true)} disabled={!nome || !cEmail || cSenha.length < 6} className="w-full mt-1">
              Criar conta
            </Button>
            <p className="text-center text-sm text-on-surface-variant mt-1">
              Já tem conta?{" "}
              <button onClick={() => setView("login")} className="text-primary font-medium">
                Entrar
              </button>
            </p>
          </div>
        )}

        {view === "cadastro" && cadOk && (
          <div className="flex flex-col items-center text-center om-fade py-6">
            <SuccessMark />
            <h2 className="text-xl font-normal text-on-surface mt-4">Conta criada!</h2>
            <p className="text-sm text-on-surface-variant mt-1 mb-6">Bem-vindo(a), {nome || "usuário"}. Tudo pronto para começar.</p>
            <Button onClick={onAuthenticated} className="w-full">
              Começar
            </Button>
          </div>
        )}

        {view === "recuperar" && (
          <div className="flex flex-col gap-4 om-fade">
            {!enviado ? (
              <>
                <p className="text-sm text-on-surface-variant -mt-2 mb-1">
                  Informe seu e-mail e enviaremos um link para redefinir a senha.
                </p>
                <TextField label="E-mail" value={rEmail} onChange={setREmail} icon="mail" type="email" placeholder="voce@email.com" />
                <Button onClick={() => setEnviado(true)} disabled={!rEmail} className="w-full mt-1">
                  Enviar link de recuperação
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-4">
                  <Icon name="mark_email_read" className="text-[30px] text-on-primary-container" />
                </div>
                <h2 className="text-lg font-medium text-on-surface">Verifique seu e-mail</h2>
                <p className="text-sm text-on-surface-variant mt-1 mb-6">
                  Enviamos um link de redefinição para <span className="font-medium">{rEmail}</span>.
                </p>
              </div>
            )}
            <Button variant="text" onClick={() => { setView("login"); setEnviado(false) }} className="w-full" icon="arrow_back">
              Voltar ao login
            </Button>
          </div>
        )}

        {view === "bloqueado" && (
          <div className="flex flex-col items-center text-center om-fade py-4">
            <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-4">
              <Icon name="lock_clock" className="text-[30px] text-on-error-container" fill />
            </div>
            <h2 className="text-lg font-medium text-on-surface">Conta bloqueada</h2>
            <p className="text-sm text-on-surface-variant mt-1 mb-4 max-w-[260px]">
              Você excedeu {MAX_TENTATIVAS} tentativas de senha. Por segurança, aguarde para tentar novamente.
            </p>
            <div className="font-mono text-3xl text-primary tabular-nums mb-6">
              00:{String(countdown).padStart(2, "0")}
            </div>
            <Button variant="text" onClick={() => setView("recuperar")}>
              Prefiro redefinir a senha
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <span className="inline-block w-5 h-5 border-2 border-on-primary/40 border-t-on-primary rounded-full" style={{ animation: "om-spin 0.7s linear infinite" }} />
}

function SuccessMark() {
  return (
    <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center om-pop">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path className="om-check" d="M4 12.5l5 5L20 6.5" stroke="var(--on-primary-container)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function PasswordStrength({ value }: { value: string }) {
  const score = Math.min(4, (value.length >= 6 ? 1 : 0) + (/[A-Z]/.test(value) ? 1 : 0) + (/[0-9]/.test(value) ? 1 : 0) + (/[^A-Za-z0-9]/.test(value) ? 1 : 0))
  const labels = ["muito fraca", "fraca", "razoável", "boa", "forte"]
  if (!value) return null
  return (
    <div className="-mt-2 px-1">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < score ? "bg-primary" : "bg-outline-variant"}`} />
        ))}
      </div>
      <span className="text-[11px] text-on-surface-variant">Força da senha: {labels[score]}</span>
    </div>
  )
}
