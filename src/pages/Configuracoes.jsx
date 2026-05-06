import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { PARCELAMENTOS } from '../lib/formulas'
import Icon from '../components/Icon'

const COMPLEXIDADE_OPCOES = [
  { value: 'Simples', label: 'Simples (1.0×)' },
  { value: 'Intermediário', label: 'Intermediário (1.3×)' },
  { value: 'Complexo', label: 'Complexo (1.5×)' },
]

export default function Configuracoes() {
  const { user, signOut } = useAuth()
  const { profile, updateProfile } = useProfile()

  const [perfilForm, setPerfilForm] = useState({ nome: '', oab: '' })
  const [configForm, setConfigForm] = useState({
    nome_escritorio: '',
    oab: '',
    valor_hora_padrao: 450,
    imposto_padrao: 13.33,
    fator_padrao: 'Intermediário',
    cor_primaria: '#1e3a5f',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    // Carregar perfil + config
    Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('configuracoes_escritorio').select('*').eq('user_id', user.id).single(),
    ]).then(([p, c]) => {
      if (p.data) {
        setPerfilForm({ nome: p.data.nome || '', oab: p.data.oab || '' })
      }
      if (c.data) {
        setConfigForm({
          nome_escritorio: c.data.nome_escritorio || '',
          oab: c.data.oab || '',
          valor_hora_padrao: c.data.valor_hora_padrao ?? 450,
          imposto_padrao: c.data.imposto_padrao ?? 13.33,
          fator_padrao: c.data.fator_padrao || 'Intermediário',
          cor_primaria: c.data.cor_primaria || '#1e3a5f',
        })
      }
      setLoading(false)
    })
  }, [user])

  const setPerfil = (k, v) => setPerfilForm((f) => ({ ...f, [k]: v }))
  const setConfig = (k, v) => setConfigForm((f) => ({ ...f, [k]: v }))
  const num = (v) => parseFloat(v) || 0

  const handleSalvar = async () => {
    if (!user) return
    setSaving(true)
    setError('')

    // Salvar perfil
    const { error: e1 } = await supabase.from('profiles').upsert({
      id: user.id,
      nome: perfilForm.nome,
      oab: perfilForm.oab,
    })
    if (e1) { setError('Erro ao salvar perfil: ' + e1.message); setSaving(false); return }

    // Salvar configurações
    const { error: e2 } = await supabase.from('configuracoes_escritorio').upsert({
      user_id: user.id,
      nome_escritorio: configForm.nome_escritorio,
      oab: configForm.oab,
      valor_hora_padrao: num(configForm.valor_hora_padrao),
      imposto_padrao: num(configForm.imposto_padrao),
      fator_padrao: configForm.fator_padrao,
      cor_primaria: configForm.cor_primaria,
      updated_at: new Date().toISOString(),
    })
    if (e2) { setError('Erro ao salvar configurações: ' + e2.message); setSaving(false); return }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lex-blue)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const plano = profile?.plano || 'free'

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--lex-navy)' }}>Configurações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lex-text-2)' }}>Personalize o LexCalc para o seu escritório</p>
      </div>

      {/* Perfil */}
      <div className="lex-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="user" size={16} style={{ color: 'var(--lex-navy)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Perfil do Advogado</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
            <img
              src={profile?.avatar_url || user?.user_metadata?.avatar_url}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: 'var(--lex-navy)' }}>
              {(perfilForm.nome || user?.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--lex-text)' }}>{user?.email}</div>
            <div className="text-xs" style={{ color: 'var(--lex-text-3)' }}>Google OAuth</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lex-label">Nome</label>
            <input className="lex-input" value={perfilForm.nome} onChange={(e) => setPerfil('nome', e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div>
            <label className="lex-label">OAB</label>
            <input className="lex-input" value={perfilForm.oab} onChange={(e) => setPerfil('oab', e.target.value)} placeholder="Ex: SP 123.456" />
          </div>
        </div>
      </div>

      {/* Escritório */}
      <div className="lex-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="settings" size={16} style={{ color: 'var(--lex-navy)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Dados do Escritório</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="lex-label">Nome do Escritório</label>
            <input className="lex-input" value={configForm.nome_escritorio} onChange={(e) => setConfig('nome_escritorio', e.target.value)} placeholder="Ex: Silva & Advogados Associados" />
          </div>
          <div>
            <label className="lex-label">OAB do Escritório</label>
            <input className="lex-input" value={configForm.oab} onChange={(e) => setConfig('oab', e.target.value)} placeholder="Ex: SP 12345" />
          </div>
        </div>
      </div>

      {/* Valores padrão */}
      <div className="lex-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="calc" size={16} style={{ color: 'var(--lex-navy)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Valores Padrão do Precificador</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="lex-label">Valor/Hora Padrão (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="lex-input"
              value={configForm.valor_hora_padrao}
              onChange={(e) => setConfig('valor_hora_padrao', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">Imposto Padrão (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="lex-input"
              value={configForm.imposto_padrao}
              onChange={(e) => setConfig('imposto_padrao', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">Complexidade Padrão</label>
            <select
              className="lex-select"
              value={configForm.fator_padrao}
              onChange={(e) => setConfig('fator_padrao', e.target.value)}
            >
              {COMPLEXIDADE_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--lex-blue-soft)', color: 'var(--lex-blue)' }}>
          Esses valores são pré-preenchidos automaticamente ao abrir o Precificador.
        </div>
      </div>

      {/* Aparência */}
      <div className="lex-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="sparkles" size={16} style={{ color: 'var(--lex-navy)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Aparência das Propostas</h2>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="lex-label">Cor Primária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 rounded-lg cursor-pointer border"
                style={{ borderColor: 'var(--lex-border)', padding: '2px' }}
                value={configForm.cor_primaria}
                onChange={(e) => setConfig('cor_primaria', e.target.value)}
              />
              <input
                type="text"
                className="lex-input w-32 font-mono text-xs"
                value={configForm.cor_primaria}
                onChange={(e) => setConfig('cor_primaria', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="lex-label">Preview</label>
            <div
              className="h-10 w-32 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: configForm.cor_primaria }}
            >
              LexCalc
            </div>
          </div>
        </div>
      </div>

      {/* Plano */}
      <div className="lex-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="crown" size={16} style={{ color: plano === 'pro' ? 'var(--lex-pro)' : 'var(--lex-text-3)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Plano Atual</h2>
        </div>

        {plano === 'free' ? (
          <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--lex-border)' }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--lex-text)' }}>Plano Free</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--lex-text-3)' }}>5 propostas/mês · Funcionalidades básicas</div>
            </div>
            <button
              className="lex-btn lex-btn-sm text-white"
              style={{ background: 'var(--lex-pro)' }}
            >
              <Icon name="crown" size={13} />
              Upgrade PRO
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--lex-pro-bg)', border: '1px solid var(--lex-pro)' }}>
            <Icon name="crown" size={20} style={{ color: 'var(--lex-pro)' }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--lex-pro)' }}>Plano PRO Ativo</div>
              <div className="text-xs" style={{ color: 'var(--lex-text-3)' }}>Propostas ilimitadas · Integrações · Suporte prioritário</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--lex-danger-bg)', color: 'var(--lex-danger)' }}>{error}</div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <button
          className="lex-btn-ghost"
          style={{ color: 'var(--lex-danger)', borderColor: 'var(--lex-danger)' }}
          onClick={signOut}
        >
          <Icon name="logout" size={16} />
          Sair da Conta
        </button>

        <button
          className="lex-btn-primary"
          onClick={handleSalvar}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
              Salvando...
            </span>
          ) : saved ? (
            <>
              <Icon name="check" size={16} />
              Salvo!
            </>
          ) : (
            <>
              <Icon name="save" size={16} />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  )
}
