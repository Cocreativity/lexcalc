import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { fmtBRL, fmtDate, calcTotaisExito } from '../lib/formulas'
import Icon from '../components/Icon'

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
}

const STATUS_PILL = {
  rascunho: 'lex-pill-rascunho',
  enviada: 'lex-pill-enviada',
  aceita: 'lex-pill-aceita',
  recusada: 'lex-pill-recusada',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [propostas, setPropostas] = useState([])
  const [casosExito, setCasosExito] = useState([])
  const [loading, setLoading] = useState(true)

  const nome = profile?.nome || user?.user_metadata?.full_name?.split(' ')[0] || 'Advogado'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('propostas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('casos_exito').select('*').eq('user_id', user.id),
    ]).then(([p, c]) => {
      setPropostas(p.data || [])
      setCasosExito(c.data || [])
      setLoading(false)
    })
  }, [user])

  // Metrics
  const totalPropostas = propostas.length
  const aceitas = propostas.filter((p) => p.status === 'aceita').length
  const taxaFechamento = totalPropostas > 0 ? Math.round((aceitas / totalPropostas) * 100) : 0
  const { totalEsperado } = calcTotaisExito(
    casosExito.map((c) => ({ proveito: c.proveito, percExito: c.perc_exito, probabilidade: c.probabilidade, meses: c.meses }))
  )

  // Funil por status
  const funil = ['rascunho', 'enviada', 'aceita', 'recusada'].map((s) => ({
    status: s,
    count: propostas.filter((p) => p.status === s).length,
  }))
  const maxFunil = Math.max(...funil.map((f) => f.count), 1)

  // Últimas 5 propostas
  const recentes = propostas.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lex-blue)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--lex-navy)' }}>
          {saudacao}, {nome}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lex-text-2)' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="lex-metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--lex-text-3)' }}>Propostas Enviadas</span>
            <div className="p-2 rounded-lg" style={{ background: 'var(--lex-blue-soft)' }}>
              <Icon name="doc" size={16} style={{ color: 'var(--lex-blue)' }} />
            </div>
          </div>
          <div className="lex-value-lg mt-2">{totalPropostas}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--lex-text-3)' }}>
            {aceitas} aceitas no total
          </div>
        </div>

        <div className="lex-metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--lex-text-3)' }}>Taxa de Fechamento</span>
            <div className="p-2 rounded-lg" style={{ background: '#f0fff4' }}>
              <Icon name="check" size={16} style={{ color: 'var(--lex-success)' }} />
            </div>
          </div>
          <div className="lex-value-lg mt-2" style={{ color: taxaFechamento >= 50 ? 'var(--lex-success)' : 'var(--lex-navy)' }}>
            {taxaFechamento}%
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--lex-text-3)' }}>
            Das propostas enviadas
          </div>
        </div>

        <div className="lex-metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--lex-text-3)' }}>Expectativa de Êxito</span>
            <div className="p-2 rounded-lg" style={{ background: '#faf5ff' }}>
              <Icon name="sparkles" size={16} style={{ color: 'var(--lex-pro)' }} />
            </div>
          </div>
          <div className="lex-value-lg mt-2" style={{ color: 'var(--lex-pro)', fontSize: '1.5rem' }}>
            {fmtBRL(totalEsperado)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--lex-text-3)' }}>
            {casosExito.length} caso{casosExito.length !== 1 ? 's' : ''} em simulação
          </div>
        </div>
      </div>

      {/* Funil + Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funil */}
        <div className="lex-card p-6">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--lex-navy)' }}>Funil de Propostas</h2>
          <div className="space-y-3">
            {funil.map(({ status, count }) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--lex-text-2)' }}>{STATUS_LABELS[status]}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--lex-text)' }}>{count}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--lex-border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / maxFunil) * 100}%`,
                      background: status === 'aceita' ? 'var(--lex-success)' :
                                  status === 'enviada' ? 'var(--lex-blue)' :
                                  status === 'recusada' ? 'var(--lex-danger)' : '#cbd5e0',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="lex-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Atividade Recente</h2>
            <button
              className="text-xs font-medium"
              style={{ color: 'var(--lex-blue)' }}
              onClick={() => navigate('/propostas')}
            >
              Ver todas
            </button>
          </div>

          {recentes.length === 0 ? (
            <div className="lex-empty">
              <Icon name="doc" size={32} />
              <p className="mt-2 text-sm">Nenhuma proposta ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => navigate('/propostas')}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--lex-blue-soft)' }}
                  >
                    <Icon name="doc" size={14} style={{ color: 'var(--lex-blue)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--lex-text)' }}>
                      {p.tipo_acao || 'Proposta'} #{p.numero}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--lex-text-3)' }}>{fmtDate(p.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={STATUS_PILL[p.status] || 'lex-pill-rascunho'}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--lex-text-2)' }}>
                      {fmtBRL(p.valor_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atalhos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          className="lex-card p-5 flex items-center gap-4 text-left hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/propostas/nova')}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--lex-navy)' }}
          >
            <Icon name="plus" size={22} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Nova Proposta</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--lex-text-3)' }}>Gere uma proposta PDF profissional</div>
          </div>
          <Icon name="chevronRight" size={16} className="ml-auto" style={{ color: 'var(--lex-text-3)' }} />
        </button>

        <button
          className="lex-card p-5 flex items-center gap-4 text-left hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/precificador')}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--lex-pro)' }}
          >
            <Icon name="sparkles" size={22} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Novo Cálculo de Êxito</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--lex-text-3)' }}>Simule honorários por resultado</div>
          </div>
          <Icon name="chevronRight" size={16} className="ml-auto" style={{ color: 'var(--lex-text-3)' }} />
        </button>
      </div>
    </div>
  )
}
