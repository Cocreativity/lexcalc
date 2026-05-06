import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { fmtBRL, fmtDate } from '../lib/formulas'
import Icon from '../components/Icon'

const STATUS_PILL = {
  rascunho: 'lex-pill-rascunho',
  enviada: 'lex-pill-enviada',
  aceita: 'lex-pill-aceita',
  recusada: 'lex-pill-recusada',
}
const STATUS_LABELS = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
}
const STATUS_ALL = ['todos', 'rascunho', 'enviada', 'aceita', 'recusada']

export default function Propostas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [propostas, setPropostas] = useState([])
  const [clientes, setClientes] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('propostas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('user_id', user.id),
    ]).then(([p, c]) => {
      setPropostas(p.data || [])
      const map = {}
      ;(c.data || []).forEach((cl) => { map[cl.id] = cl.nome })
      setClientes(map)
      setLoading(false)
    })
  }, [user])

  const filtered = propostas.filter((p) => {
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    const matchBusca =
      !busca ||
      (p.tipo_acao || '').toLowerCase().includes(busca.toLowerCase()) ||
      (clientes[p.cliente_id] || '').toLowerCase().includes(busca.toLowerCase()) ||
      String(p.numero).includes(busca)
    return matchStatus && matchBusca
  })

  const handleRowClick = (proposta) => {
    navigate('/propostas/nova', { state: { proposta } })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--lex-navy)' }}>Propostas</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lex-text-2)' }}>{propostas.length} proposta{propostas.length !== 1 ? 's' : ''} no total</p>
        </div>
        <button className="lex-btn-navy" onClick={() => navigate('/propostas/nova')}>
          <Icon name="plus" size={16} />
          Nova Proposta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Busca */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-48" style={{ borderColor: 'var(--lex-border)', background: '#fff' }}>
          <Icon name="search" size={15} style={{ color: 'var(--lex-text-3)' }} />
          <input
            type="text"
            placeholder="Buscar por tipo, cliente, número..."
            className="bg-transparent text-sm outline-none flex-1"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button onClick={() => setBusca('')} style={{ color: 'var(--lex-text-3)' }}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUS_ALL.map((s) => (
            <button
              key={s}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filtroStatus === s ? 'var(--lex-navy)' : 'var(--lex-border)',
                color: filtroStatus === s ? '#fff' : 'var(--lex-text-2)',
              }}
              onClick={() => setFiltroStatus(s)}
            >
              {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="lex-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lex-blue)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="lex-empty">
            <Icon name="doc" size={36} />
            <p className="mt-2 text-sm font-medium">
              {busca || filtroStatus !== 'todos' ? 'Nenhuma proposta encontrada' : 'Nenhuma proposta ainda'}
            </p>
            {!busca && filtroStatus === 'todos' && (
              <button
                className="mt-3 lex-btn-primary lex-btn-sm"
                onClick={() => navigate('/propostas/nova')}
              >
                <Icon name="plus" size={14} />
                Criar primeira proposta
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="lex-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo de Ação</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Valor Total</th>
                  <th>Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => handleRowClick(p)}>
                    <td className="font-mono text-xs" style={{ color: 'var(--lex-text-3)' }}>
                      #{String(p.numero).padStart(4, '0')}
                    </td>
                    <td className="font-medium">{p.tipo_acao || '—'}</td>
                    <td style={{ color: 'var(--lex-text-2)' }}>{clientes[p.cliente_id] || '—'}</td>
                    <td>
                      <span className={STATUS_PILL[p.status] || 'lex-pill-rascunho'}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="font-semibold">{fmtBRL(p.valor_total)}</td>
                    <td style={{ color: 'var(--lex-text-3)' }}>{fmtDate(p.created_at)}</td>
                    <td>
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--lex-text-3)' }}
                        onClick={(e) => { e.stopPropagation(); handleRowClick(p) }}
                        title="Ver proposta"
                      >
                        <Icon name="eye" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
