import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AuthLayout } from '../components/layout'
import { Button, Input, StatusMessage } from '../components/ui'
import { authService } from '../services/authService'

type MessageType = 'success' | 'error' | 'info'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: MessageType; text: string }>({ type: 'info', text: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage({ type: 'info', text: '' })

    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Informe um e-mail valido.' })
      return
    }

    setLoading(true)
    try {
      const result = await authService.forgotPassword({ email })
      setMessage({ type: 'success', text: result.message })
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Falha no envio de recuperacao.'
      setMessage({ type: 'error', text })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Esqueci minha senha" subtitle="Recupere seu acesso no NeoPrice" cardClassName="auth-card-forgot">
      <form className="form" onSubmit={handleSubmit}>
        <Input
          id="forgot-email"
          type="email"
          label="E-mail"
          placeholder="nome@neoprice.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={<Mail size={18} />}
        />

        {message.text ? <StatusMessage type={message.type} message={message.text} /> : null}

        <Button type="submit" loading={loading}>
          Enviar link
        </Button>

        <div className="auth-links">
          <Link to="/login">Voltar para login</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
