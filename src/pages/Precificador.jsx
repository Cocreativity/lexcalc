import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  calcHonorarios,
  calcCasoExito,
  calcTotaisExito,
  fmtBRL,
  PROB_WEIGHTS,
  COMPLEXIDADE_LABELS,
  PARCELAMENTOS,
  parcelasFromLabel,
} from '../lib/formulas'
import Icon from '../components/Icon'

// ─── Tab: Honorários Diretos ────────────────────────────────────────────────

function HonorariosTab() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    tipoAcao: '',
    honorarioBase: 0,
    horas: 0,
    valorHora: 450,
    complexidade: 1.3,
    impostoPct: 13.33,
    parcelamento: 'À vista',
    observacoes: '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const num = (v) => parseFloat(v) || 0

  const result = calcHonorarios({
    honorarioBase: num(form.honorarioBase),
    horas: num(form.horas),
    valorHora: num(form.valorHora),
    complexidade: num(form.complexidade),
    impostoPct: num(form.impostoPct),
    parcelas: parcelasFromLabel(form.parcelamento),
  })

  const handleSalvar = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('propostas').insert({
      user_id: user.id,
      tipo_acao: form.tipoAcao,
      horas: num(form.horas),
      valor_hora: num(form.valorHora),
      honorario_base: num(form.honorarioBase),
      fator_complexidade: num(form.complexidade),
      imposto_pct: num(form.impostoPct),
      parcelamento: form.parcelamento,
      valor_total: result.precoFinal,
      observacoes: form.observacoes,
      status: 'rascunho',
    }).select().single()
    setSaving(false)
    if (err) { setError('Erro ao salvar proposta: ' + err.message); return }
    navigate('/propostas/nova', { state: { proposta: data } })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="lex-card p-6 space-y-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Dados do Caso</h2>

        <div>
          <label className="lex-label">Tipo de Ação / Serviço</label>
          <input
            className="lex-input"
            placeholder="Ex: Ação Trabalhista, Inventário..."
            value={form.tipoAcao}
            onChange={(e) => set('tipoAcao', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lex-label">Honorário Base (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="lex-input"
              value={form.honorarioBase}
              onChange={(e) => set('honorarioBase', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">Horas Estimadas</label>
            <input
              type="number"
              step="0.5"
              min="0"
              className="lex-input"
              value={form.horas}
              onChange={(e) => set('horas', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lex-label">Valor por Hora (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="lex-input"
              value={form.valorHora}
              onChange={(e) => set('valorHora', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">Complexidade</label>
            <select
              className="lex-select"
              value={form.complexidade}
              onChange={(e) => set('complexidade', e.target.value)}
            >
              <option value={1.0}>Simples (1.0×)</option>
              <option value={1.3}>Intermediário (1.3×)</option>
              <option value={1.5}>Complexo (1.5×)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="lex-label">Impostos (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="lex-input"
              value={form.impostoPct}
              onChange={(e) => set('impostoPct', e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--lex-text-3)' }}>Gross-up aplicado automaticamente</p>
          </div>
          <div>
            <label className="lex-label">Parcelamento</label>
            <select
              className="lex-select"
              value={form.parcelamento}
              onChange={(e) => set('parcelamento', e.target.value)}
            >
              {PARCELAMENTOS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="lex-label">Observações</label>
          <textarea
            className="lex-input resize-none"
            rows={3}
            placeholder="Notas internas sobre o caso..."
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--lex-danger-bg)', color: 'var(--lex-danger)' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button className="lex-btn-primary flex-1" onClick={handleSalvar} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
                Salvando...
              </span>
            ) : (
              <>
                <Icon name="doc" size={16} />
                Gerar Proposta PDF
              </>
            )}
          </button>
          <button className="lex-btn-ghost" title="Salvar como modelo">
            <Icon name="save" size={16} />
          </button>
        </div>
      </div>

      {/* Live Summary */}
      <div className="space-y-4">
        <div className="lex-card p-6">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--lex-navy)' }}>Resumo em Tempo Real</h2>

          <div className="space-y-3">
            {[
              { label: 'Custo Operacional', value: result.custoOperacional, sub: `Base ${fmtBRL(num(form.honorarioBase))} + ${num(form.horas)}h × ${fmtBRL(num(form.valorHora))}` },
              { label: `Subtotal (× ${COMPLEXIDADE_LABELS[form.complexidade] || form.complexidade})`, value: result.subtotal },
              { label: `Preço Final (gross-up ${num(form.impostoPct).toLocaleString('pt-BR')}%)`, value: result.precoFinal, highlight: true },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} className={`flex items-center justify-between py-2 ${highlight ? 'border-t pt-3 mt-3' : ''}`} style={highlight ? { borderColor: 'var(--lex-border)' } : {}}>
                <div>
                  <div className="text-sm" style={{ color: highlight ? 'var(--lex-navy)' : 'var(--lex-text-2)', fontWeight: highlight ? 600 : 400 }}>{label}</div>
                  {sub && <div className="text-xs" style={{ color: 'var(--lex-text-3)' }}>{sub}</div>}
                </div>
                <span
                  className={highlight ? 'lex-value-md' : 'text-sm font-semibold'}
                  style={{ color: highlight ? 'var(--lex-navy)' : 'var(--lex-text)' }}
                >
                  {fmtBRL(value)}
                </span>
              </div>
            ))}
          </div>

          {form.parcelamento !== 'À vista' && (
            <div
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'var(--lex-blue-soft)' }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--lex-blue)' }}>
                Condição de Pagamento
              </div>
              <div className="font-display font-bold text-2xl" style={{ color: 'var(--lex-blue)' }}>
                {form.parcelamento} de {fmtBRL(result.valorParcela)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--lex-blue)' }}>
                Total: {fmtBRL(result.precoFinal)}
              </div>
            </div>
          )}
        </div>

        {/* Quick tips */}
        <div className="lex-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--lex-text-3)' }}>Sobre o Cálculo</div>
          <ul className="text-xs space-y-1.5" style={{ color: 'var(--lex-text-2)' }}>
            <li>• Gross-up: o imposto é calculado sobre o preço final, não adicionado ao subtotal</li>
            <li>• Complexidade 1.3× é recomendada para a maioria dos casos cíveis</li>
            <li>• Inclua horas de deslocamento e perícias externas na estimativa</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Simulador de Êxito ─────────────────────────────────────────────────

const NOVO_CASO = {
  nome: '',
  proveito: 0,
  percExito: 30,
  probabilidade: 'Alta',
  meses: 24,
}

function ExitoTab() {
  const { user } = useAuth()
  const [casos, setCasos] = useState([])
  const [novoCase, setNovoCase] = useState({ ...NOVO_CASO })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('casos_exito').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setCasos(data || []); setLoading(false) })
  }, [user])

  const setNovo = (k, v) => setNovoCase((c) => ({ ...c, [k]: v }))
  const num = (v) => parseFloat(v) || 0

  const handleAdd = async () => {
    if (!novoCase.nome) { setError('Informe o nome do caso'); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('casos_exito').insert({
      user_id: user.id,
      nome: novoCase.nome,
      proveito: num(novoCase.proveito),
      perc_exito: num(novoCase.percExito),
      probabilidade: novoCase.probabilidade,
      meses: parseInt(novoCase.meses) || 24,
    }).select().single()
    setSaving(false)
    if (err) { setError('Erro ao salvar caso: ' + err.message); return }
    setCasos((prev) => [data, ...prev])
    setNovoCase({ ...NOVO_CASO })
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    await supabase.from('casos_exito').delete().eq('id', id)
    setCasos((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)
  }

  const casosMapped = casos.map((c) => ({
    ...c,
    percExito: c.perc_exito,
    ...calcCasoExito({ proveito: c.proveito, percExito: c.perc_exito, probabilidade: c.probabilidade, meses: c.meses }),
  }))

  const { totalEsperado, mediaMensal } = calcTotaisExito(
    casos.map((c) => ({ proveito: c.proveito, percExito: c.perc_exito, probabilidade: c.probabilidade, meses: c.meses }))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lex-blue)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Totais */}
      {casos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="lex-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--lex-text-3)' }}>Total Esperado de Êxito</div>
            <div className="lex-value-lg" style={{ color: 'var(--lex-pro)' }}>{fmtBRL(totalEsperado)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--lex-text-3)' }}>Soma ponderada pela probabilidade</div>
          </div>
          <div className="lex-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--lex-text-3)' }}>Renda Mensal Estimada</div>
            <div className="lex-value-lg" style={{ color: 'var(--lex-success)' }}>{fmtBRL(mediaMensal)}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--lex-text-3)' }}>Média dos {casos.length} caso{casos.length !== 1 ? 's' : ''} ativos</div>
          </div>
        </div>
      )}

      {/* Formulário Novo Caso */}
      <div className="lex-card p-6">
        <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--lex-navy)' }}>Adicionar Caso de Êxito</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="lex-label">Nome do Caso</label>
            <input
              className="lex-input"
              placeholder="Ex: Ação Trabalhista — João Silva"
              value={novoCase.nome}
              onChange={(e) => setNovo('nome', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">Proveito Econômico (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="lex-input"
              value={novoCase.proveito}
              onChange={(e) => setNovo('proveito', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">% Êxito</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className="lex-input"
              value={novoCase.percExito}
              onChange={(e) => setNovo('percExito', e.target.value)}
            />
          </div>
          <div>
            <label className="lex-label">Probabilidade</label>
            <select
              className="lex-select"
              value={novoCase.probabilidade}
              onChange={(e) => setNovo('probabilidade', e.target.value)}
            >
              {Object.keys(PROB_WEIGHTS).map((k) => (
                <option key={k} value={k}>{k} ({PROB_WEIGHTS[k] * 100}%)</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="lex-label">Prazo (meses)</label>
            <input
              type="number"
              step="1"
              min="1"
              className="lex-input"
              value={novoCase.meses}
              onChange={(e) => setNovo('meses', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            {/* Preview do novo caso */}
            {num(novoCase.proveito) > 0 && (
              <div className="p-3 rounded-lg w-full" style={{ background: 'var(--lex-blue-soft)' }}>
                {(() => {
                  const { lucro, rendaMensal } = calcCasoExito({
                    proveito: num(novoCase.proveito),
                    percExito: num(novoCase.percExito),
                    probabilidade: novoCase.probabilidade,
                    meses: parseInt(novoCase.meses) || 24,
                  })
                  return (
                    <div className="flex gap-4">
                      <div>
                        <div className="text-xs" style={{ color: 'var(--lex-blue)' }}>Lucro Esperado</div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--lex-blue)' }}>{fmtBRL(lucro)}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: 'var(--lex-blue)' }}>Renda/mês</div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--lex-blue)' }}>{fmtBRL(rendaMensal)}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
          <div className="flex items-end">
            <button
              className="lex-btn-navy w-full"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? (
                <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
              ) : (
                <Icon name="plus" size={16} />
              )}
              Adicionar
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg p-3 text-sm" style={{ background: 'var(--lex-danger-bg)', color: 'var(--lex-danger)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Tabela de casos */}
      {casosMapped.length === 0 ? (
        <div className="lex-card">
          <div className="lex-empty">
            <Icon name="sparkles" size={36} />
            <p className="mt-2 text-sm font-medium">Nenhum caso de êxito ainda</p>
            <p className="text-xs mt-1">Adicione casos acima para visualizar as projeções</p>
          </div>
        </div>
      ) : (
        <div className="lex-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="lex-table">
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Proveito</th>
                  <th>% Êxito</th>
                  <th>Probabilidade</th>
                  <th>Prazo</th>
                  <th>Lucro Esperado</th>
                  <th>Renda/mês</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {casosMapped.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.nome}</td>
                    <td>{fmtBRL(c.proveito)}</td>
                    <td>{c.perc_exito}%</td>
                    <td>
                      <span
                        className="lex-pill"
                        style={{
                          background: c.probabilidade === 'Alta' ? 'var(--lex-success-bg)' : c.probabilidade === 'Média' ? 'var(--lex-warn-bg)' : 'var(--lex-danger-bg)',
                          color: c.probabilidade === 'Alta' ? 'var(--lex-success)' : c.probabilidade === 'Média' ? 'var(--lex-warn)' : 'var(--lex-danger)',
                        }}
                      >
                        {c.probabilidade}
                      </span>
                    </td>
                    <td>{c.meses}m</td>
                    <td className="font-semibold" style={{ color: 'var(--lex-pro)' }}>{fmtBRL(c.lucro)}</td>
                    <td className="font-semibold" style={{ color: 'var(--lex-success)' }}>{fmtBRL(c.rendaMensal)}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: 'var(--lex-text-3)' }}
                        title="Remover caso"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Precificador (main page) ─────────────────────────────────────────────────

export default function Precificador() {
  const [tab, setTab] = useState('honorarios')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--lex-navy)' }}>Precificador</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--lex-text-2)' }}>Calcule honorários e simule casos de êxito</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--lex-border)' }}>
        <button
          className={`lex-tab ${tab === 'honorarios' ? 'active' : ''}`}
          onClick={() => setTab('honorarios')}
        >
          <span className="flex items-center gap-2">
            <Icon name="calc" size={15} />
            Honorários Diretos
          </span>
        </button>
        <button
          className={`lex-tab ${tab === 'exito' ? 'active' : ''}`}
          onClick={() => setTab('exito')}
        >
          <span className="flex items-center gap-2">
            <Icon name="sparkles" size={15} />
            Simulador de Êxito
          </span>
        </button>
      </div>

      {tab === 'honorarios' ? <HonorariosTab /> : <ExitoTab />}
    </div>
  )
}
