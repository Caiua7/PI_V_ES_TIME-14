import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { AuthLayout } from '../components/layout'
import { Button, Input, StatusMessage } from '../components/ui'
import { authService } from '../services/authService'
import type { AuthSession } from '../types'

type MessageType = 'success' | 'error' | 'info'

function validateLogin(email: string, senha: string) {
  if (!email.trim()) return 'Informe o e-mail.'
  if (!email.includes('@')) return 'Informe um e-mail valido.'
  if (!senha.trim()) return 'Informe a senha.'
  if (senha.length < 6) return 'A senha deve ter ao menos 6 caracteres.'
  return ''
}

export default function LoginPage({
  onLogin,
}: {
  onLogin: (session: AuthSession) => void
}) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: MessageType; text: string }>({ type: 'info', text: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage({ type: 'info', text: '' })

    const validationError = validateLogin(email, senha)
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setLoading(true)
    try {
      const session = await authService.login({ email, senha, lembrar })
      setMessage({ type: 'success', text: 'Login realizado com sucesso.' })
      onLogin(session)
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Falha no login mockado.'
      setMessage({ type: 'error', text })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="" subtitle="Acessar plataforma" cardClassName="auth-card-login">
      <form className="form" onSubmit={handleSubmit}>
        <Input
          id="login-email"
          type="email"
          label="E-mail Corporativo"
          placeholder="seu.email@neoprice.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={<Mail size={18} />}
        />

        <Input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          label="Senha"
          placeholder="........"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          icon={<Lock size={18} />}
          rightElement={
            <button type="button" className="icon-input-btn" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {message.text ? <StatusMessage type={message.type} message={message.text} /> : null}

        <div className="auth-aux-row">
          <label className="checkbox-row">
            <input
              type="checkbox"
              className="remember-checkbox"
              checked={lembrar}
              onChange={(event) => setLembrar(event.target.checked)}
            />
            <span>Lembrar de mim</span>
          </label>
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </div>

        <Button type="submit" loading={loading}>
          Entrar
        </Button>

        <div className="auth-links auth-links-centered">
          <span>
            Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  )
}
