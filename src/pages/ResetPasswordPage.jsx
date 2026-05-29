import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Icon from '../components/Icon'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      const { error: err } = await updatePassword(password)
      if (err) throw err
      setSuccess(true)
      setTimeout(() => navigate('/', { replace: true }), 2500)
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--lex-bg)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, rgba(43,108,176,0.06) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 20%, rgba(30,58,95,0.08) 0%, transparent 40%)`,
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        <div className="lex-card p-8">

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--lex-navy)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4v14h10" />
                <circle cx="6" cy="4" r="1.5" fill="#fff" stroke="none" />
                <circle cx="16" cy="18" r="1.5" fill="#fff" stroke="none" />
                <path d="M11 4l4 9" />
                <path d="M9 13h8" />
              </svg>
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-center mb-0.5" style={{ color: 'var(--lex-navy)' }}>
            LexCalc
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--lex-text-3)' }}>
            Defina sua nova senha
          </p>

          {error && (
            <div className="text-sm px-3 py-2.5 rounded-lg mb-4" style={{ background: 'var(--lex-danger-soft)', color: 'var(--lex-danger)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm px-3 py-2.5 rounded-lg mb-4" style={{ background: 'var(--lex-success-soft)', color: 'var(--lex-success)' }}>
              Senha redefinida com sucesso! Redirecionando...
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="lex-field">
                <div className="flex items-center justify-between mb-1">
                  <label className="lex-label" style={{ marginBottom: 0 }}>Nova senha</label>
                </div>
                <div className="lex-field-wrap">
                  <input
                    className="lex-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--lex-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}
                    title={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Icon name={showPass ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </div>

              <div className="lex-field">
                <label className="lex-label">Confirmar nova senha</label>
                <input
                  className="lex-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="lex-btn lex-btn-primary lex-btn-block mt-1"
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Aguarde...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--lex-text-3)' }}>
          &copy; {new Date().getFullYear()} LexCalc &mdash; Desenvolvido para advogados brasileiros
        </p>
      </div>
    </div>
  )
}
