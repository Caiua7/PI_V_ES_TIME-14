import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { AuthLayout } from '../components/layout'
import { Button, Input, Select, StatusMessage } from '../components/ui'
import { authService } from '../services/authService'
import type { AuthSession } from '../types'

const areaOptions = [
  { value: '', label: 'Selecione sua área' },
  { value: 'Pricing Manager', label: 'Pricing Manager' },
  { value: 'Pre Sales', label: 'Pre Sales' },
  { value: 'Customer Success', label: 'Customer Success' },
]

type MessageType = 'success' | 'error' | 'info'

export default function CadastroPage({
  onRegister,
}: {
  onRegister: (session: AuthSession) => void
}) {
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState('')
  const [areaCargo, setAreaCargo] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: MessageType; text: string }>({ type: 'info', text: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage({ type: 'info', text: '' })

    if (!nome.trim()) return setMessage({ type: 'error', text: 'Informe o nome.' })
    if (!sobrenome.trim()) return setMessage({ type: 'error', text: 'Informe o sobrenome.' })
    if (!email.includes('@')) return setMessage({ type: 'error', text: 'Informe um e-mail valido.' })
    if (!areaCargo) return setMessage({ type: 'error', text: 'Selecione a área/time.' })
    if (senha.length < 6) return setMessage({ type: 'error', text: 'A senha deve ter no minimo 6 caracteres.' })

    setLoading(true)
    try {
      const session = await authService.register({
        nome: `${nome.trim()} ${sobrenome.trim()}`,
        email,
        areaCargo,
        senha,
        confirmarSenha: senha,
      })
      setMessage({ type: 'success', text: 'Cadastro concluido com sucesso.' })
      onRegister(session)
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Falha no cadastro mockado.'
      setMessage({ type: 'error', text })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="" subtitle="Criar conta" cardClassName="auth-card-cadastro">
      <form className="form" onSubmit={handleSubmit}>
        <div className="name-grid">
          <Input
            id="cadastro-nome"
            label="Nome"
            placeholder="João"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            icon={<User size={18} />}
          />
          <Input
            id="cadastro-sobrenome"
            label="Sobrenome"
            placeholder="Silva"
            value={sobrenome}
            onChange={(event) => setSobrenome(event.target.value)}
            icon={<User size={18} />}
          />
        </div>

        <Select
          id="cadastro-area"
          label="Área/Time"
          value={areaCargo}
          onChange={(event) => setAreaCargo(event.target.value)}
          options={areaOptions}
          icon={<Building2 size={18} />}
        />

        <Input
          id="cadastro-email"
          type="email"
          label="E-mail Corporativo"
          placeholder="seu.email@neoprice.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={<Mail size={18} />}
        />

        <Input
          id="cadastro-senha"
          type={showPassword ? 'text' : 'password'}
          label="Senha"
          placeholder="Mínimo 6 caracteres"
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

        <Button type="submit" loading={loading}>
          Cadastrar
        </Button>

        <div className="auth-links auth-links-centered">
          <span>
            Já tem uma conta? <Link to="/login">Fazer login</Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  )
}
