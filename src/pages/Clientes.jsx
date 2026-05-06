import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { fmtBRL, fmtDate } from '../lib/formulas'
import Icon from '../components/Icon'

const TIPO_LABELS = { PF: 'Pessoa Física', PJ: 'Pessoa Jurídica' }

function ClienteDrawer({ cliente, onClose, onSave, onDelete }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ ...cliente })
  const [propostas, setPropostas] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [loadingPropostas, setLoadingPropostas] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    setForm({ ...cliente })
    if (cliente?.id && user) {
      setLoadingPropostas(true)
      supabase.from('propostas').select('*').eq('user_id', user.id).eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { setPropostas(data || []); setLoadingPropostas(false) })
    } else {
      setPropostas([])
    }
  }, [cliente, user])

  const handleSave = async () => {
    if (!form.nome) { setError('Informe o nome do cliente'); return }
    setSaving(true)
    setError('')
    let err
    if (form.id) {
      ({ error: err } = await supabase.from('clientes').update({
        nome: form.nome, email: form.email, telefone: form.telefone,
        cpf_cnpj: form.cpf_cnpj, tipo_cliente: form.tipo_cliente, observacoes: form.observacoes,
      }).eq('id', form.id))
    } else {
      const { error: e2 } = await supabase.from('clientes').insert({
        user_id: user.id,
        nome: form.nome, email: form.email, telefone: form.telefone,
        cpf_cnpj: form.cpf_cnpj, tipo_cliente: form.tipo_cliente || 'PF', observacoes: form.observacoes,
      })
      err = e2
    }
    setSaving(false)
    if (err) { setError('Erro: ' + err.message); return }
    onSave()
  }

  const handleDelete = async () => {
    if (!form.id) return
    if (!confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    await supabase.from('clientes').delete().eq('id', form.id)
    setDeleting(false)
    onDelete(form.id)
  }

  return (
    <>
      <div className="lex-overlay" onClick={onClose} />
      <div className="lex-drawer">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--lex-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>
            {form.id ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'var(--lex-text-2)' }} onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="lex-label">Nome *</label>
            <input className="lex-input" value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lex-label">Tipo</label>
              <select className="lex-select" value={form.tipo_cliente || 'PF'} onChange={(e) => set('tipo_cliente', e.target.value)}>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div>
              <label className="lex-label">CPF/CNPJ</label>
              <input className="lex-input" value={form.cpf_cnpj || ''} onChange={(e) => set('cpf_cnpj', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="lex-label">E-mail</label>
            <input type="email" className="lex-input" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="lex-label">Telefone</label>
            <input type="tel" className="lex-input" value={form.telefone || ''} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="lex-label">Observações</label>
            <textarea className="lex-input resize-none" rows={3} value={form.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} />
          </div>

          {error && (
            <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--lex-danger-bg)', color: 'var(--lex-danger)' }}>{error}</div>
          )}

          {/* Histórico de propostas */}
          {form.id && (
            <div>
              <div className="lex-divider" />
              <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--lex-text-3)' }}>
                Histórico de Propostas ({propostas.length})
              </div>
              {loadingPropostas ? (
                <div className="text-xs text-center py-4" style={{ color: 'var(--lex-text-3)' }}>Carregando...</div>
              ) : propostas.length === 0 ? (
                <div className="text-xs text-center py-4" style={{ color: 'var(--lex-text-3)' }}>Nenhuma proposta para este cliente</div>
              ) : (
                <div className="space-y-2">
                  {propostas.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--lex-bg)' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--lex-text)' }}>{p.tipo_acao || 'Proposta'} #{p.numero}</div>
                        <div className="text-xs" style={{ color: 'var(--lex-text-3)' }}>{fmtDate(p.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: 'var(--lex-navy)' }}>{fmtBRL(p.valor_total)}</div>
                        <span className={`lex-pill lex-pill-${p.status}`} style={{ fontSize: '10px' }}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex gap-2" style={{ borderColor: 'var(--lex-border)' }}>
          {form.id && (
            <button className="lex-btn-ghost lex-btn-sm" onClick={handleDelete} disabled={deleting} title="Excluir cliente">
              <Icon name="trash" size={14} />
            </button>
          )}
          <button className="lex-btn-ghost lex-btn-sm flex-1" onClick={onClose}>Cancelar</button>
          <button className="lex-btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" /> : <Icon name="save" size={14} />}
            Salvar
          </button>
        </div>
      </div>
    </>
  )
}

export default function Clientes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [drawerCliente, setDrawerCliente] = useState(null)

  const fetchClientes = () => {
    if (!user) return
    supabase.from('clientes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setClientes(data || []); setLoading(false) })
  }

  useEffect(() => { fetchClientes() }, [user])

  const filtered = clientes.filter((c) =>
    !busca ||
    (c.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.cpf_cnpj || '').includes(busca)
  )

  const handleSave = () => {
    setDrawerCliente(null)
    setLoading(true)
    fetchClientes()
  }

  const handleDelete = (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id))
    setDrawerCliente(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--lex-navy)' }}>Clientes</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--lex-text-2)' }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="lex-btn-navy" onClick={() => setDrawerCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo_cliente: 'PF', observacoes: '' })}>
          <Icon name="plus" size={16} />
          Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border max-w-md" style={{ borderColor: 'var(--lex-border)', background: '#fff' }}>
        <Icon name="search" size={15} style={{ color: 'var(--lex-text-3)' }} />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail, CPF/CNPJ..."
          className="bg-transparent text-sm outline-none flex-1"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {busca && <button onClick={() => setBusca('')} style={{ color: 'var(--lex-text-3)' }}><Icon name="x" size={14} /></button>}
      </div>

      {/* Table */}
      <div className="lex-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lex-blue)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="lex-empty">
            <Icon name="users" size={36} />
            <p className="mt-2 text-sm font-medium">{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
            {!busca && (
              <button
                className="mt-3 lex-btn-primary lex-btn-sm"
                onClick={() => setDrawerCliente({ nome: '', email: '', telefone: '', cpf_cnpj: '', tipo_cliente: 'PF', observacoes: '' })}
              >
                <Icon name="plus" size={14} />
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="lex-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>CPF/CNPJ</th>
                  <th>Cadastro</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setDrawerCliente(c)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'var(--lex-navy)' }}
                        >
                          {(c.nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.nome}</span>
                      </div>
                    </td>
                    <td>
                      <span className="lex-pill" style={{ background: 'var(--lex-blue-soft)', color: 'var(--lex-blue)', fontSize: '11px' }}>
                        {c.tipo_cliente || 'PF'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--lex-text-2)' }}>{c.email || '—'}</td>
                    <td style={{ color: 'var(--lex-text-2)' }}>{c.telefone || '—'}</td>
                    <td style={{ color: 'var(--lex-text-3)', fontFamily: 'monospace', fontSize: '12px' }}>{c.cpf_cnpj || '—'}</td>
                    <td style={{ color: 'var(--lex-text-3)' }}>{fmtDate(c.created_at)}</td>
                    <td>
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        style={{ color: 'var(--lex-text-3)' }}
                        onClick={(e) => { e.stopPropagation(); setDrawerCliente(c) }}
                      >
                        <Icon name="edit" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerCliente && (
        <ClienteDrawer
          cliente={drawerCliente}
          onClose={() => setDrawerCliente(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
