import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import {
  calcHonorarios,
  fmtBRL,
  COMPLEXIDADE_LABELS,
  PARCELAMENTOS,
  parcelasFromLabel,
} from '../lib/formulas'
import Icon from '../components/Icon'

const A4_W = 794
const A4_H = 1123

function gerarHTMLProposta({ form, result, profile }) {
  const nomeEscritorio = profile?.nome_escritorio || profile?.nome || 'Escritório de Advocacia'
  const oab = profile?.oab || ''
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const parcelaLabel = form.parcelamento === 'À vista'
    ? `À vista: ${fmtBRL(result.precoFinal)}`
    : `${form.parcelamento} de ${fmtBRL(result.valorParcela)} (Total: ${fmtBRL(result.precoFinal)})`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Times New Roman', serif;
  color: #1a202c;
  background: white;
  padding: 20px 24px;
  font-size: 13px;
  line-height: 1.7;
}
.header {
  text-align: center;
  border-bottom: 2px solid #1e3a5f;
  padding-bottom: 20px;
  margin-bottom: 28px;
}
.header h1 {
  font-size: 20px;
  font-weight: bold;
  color: #1e3a5f;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.header .sub { font-size: 12px; color: #718096; margin-top: 4px; }
.secao { margin-bottom: 24px; }
.secao-titulo {
  font-size: 11px;
  font-weight: bold;
  color: #1e3a5f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-left: 3px solid #1e3a5f;
  padding-left: 10px;
  margin-bottom: 10px;
}
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.campo { display: flex; gap: 6px; }
.campo-label { color: #718096; min-width: 80px; }
.campo-valor { font-weight: 500; }
.valor-box {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 10px 0;
}
.valor-total { font-size: 26px; font-weight: bold; color: #1e3a5f; }
.valor-parcela { font-size: 16px; color: #2b6cb0; margin-top: 4px; }
.clausula {
  background: #fffaf0;
  border: 1px solid #f6e05e;
  border-radius: 8px;
  padding: 14px 18px;
  margin: 10px 0;
  font-size: 12px;
}
.clausula-titulo { font-weight: bold; color: #b7791f; margin-bottom: 6px; }
ul { padding-left: 18px; }
li { margin-bottom: 5px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
td { padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
td:last-child { text-align: right; font-weight: 500; }
.assinatura { margin-top: 48px; display: flex; justify-content: space-between; gap: 32px; }
.assinatura-bloco { flex: 1; text-align: center; }
.linha { border-top: 1px solid #1a202c; margin-bottom: 6px; padding-top: 6px; }
.rodape {
  margin-top: 40px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  text-align: center;
  font-size: 11px;
  color: #a0aec0;
}
</style>
</head>
<body>
<div class="header">
  <h1>Proposta de Prestação de Serviços Jurídicos</h1>
  <div class="sub">${nomeEscritorio}${oab ? ` · OAB ${oab}` : ''}</div>
</div>

<div class="secao">
  <div class="secao-titulo">Destinatário</div>
  <div class="grid2">
    <div class="campo"><span class="campo-label">Cliente:</span><span class="campo-valor">${form.clienteNome || '___________________'}</span></div>
    <div class="campo"><span class="campo-label">Data:</span><span class="campo-valor">${dataHoje}</span></div>
    <div class="campo"><span class="campo-label">Tipo de Ação:</span><span class="campo-valor">${form.tipoAcao || '___________________'}</span></div>
    ${form.clienteEmail ? `<div class="campo"><span class="campo-label">E-mail:</span><span class="campo-valor">${form.clienteEmail}</span></div>` : ''}
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Investimento e Forma de Pagamento</div>
  <div class="valor-box">
    <div class="valor-total">${fmtBRL(result.precoFinal)}</div>
    <div class="valor-parcela">${parcelaLabel}</div>
  </div>
</div>

<div class="secao">
  <div class="secao-titulo">Detalhamento dos Honorários</div>
  <table>
    <tr><td style="color:#718096;">Honorário base</td><td>${fmtBRL(form.honorarioBase || 0)}</td></tr>
    <tr><td style="color:#718096;">${form.horas || 0}h × ${fmtBRL(form.valorHora || 0)}/h</td><td>${fmtBRL((form.horas || 0) * (form.valorHora || 0))}</td></tr>
    <tr><td style="color:#718096;">Fator de complexidade (${COMPLEXIDADE_LABELS[form.complexidade] || form.complexidade})</td><td>${form.complexidade}×</td></tr>
    <tr><td style="color:#718096;">Impostos — gross-up ${form.impostoPct || 0}%</td><td>${fmtBRL(result.precoFinal - result.subtotal)}</td></tr>
  </table>
</div>

<div class="clausula">
  <div class="clausula-titulo">Cláusula de Bonificação por Pontualidade</div>
  Em caso de pagamento até o vencimento acordado, o cliente terá direito a desconto de 5% sobre o valor total da proposta, como forma de reconhecimento pela pontualidade no cumprimento das obrigações financeiras.
</div>

<div class="secao">
  <div class="secao-titulo">Escopo e Compromissos</div>
  <ul>
    <li>Análise completa do caso e elaboração de estratégia jurídica personalizada</li>
    <li>Elaboração e protocolo de todas as peças processuais necessárias</li>
    <li>Acompanhamento integral do processo em todas as instâncias cabíveis</li>
    <li>Comunicação proativa sobre o andamento processual e eventuais mudanças de estratégia</li>
    <li>Prazo de retorno para dúvidas e solicitações: até 48 horas úteis</li>
    <li>Relatório mensal de andamento processual (quando aplicável)</li>
    ${form.observacoes ? `<li>${form.observacoes}</li>` : ''}
  </ul>
</div>

<div class="assinatura">
  <div class="assinatura-bloco">
    <div class="linha"></div>
    <strong>${nomeEscritorio}</strong>
    ${oab ? `<div>OAB ${oab}</div>` : ''}
  </div>
  <div class="assinatura-bloco">
    <div class="linha"></div>
    <strong>${form.clienteNome || 'Cliente'}</strong>
    <div style="color:#718096;font-size:11px;">Contratante</div>
  </div>
</div>

<div class="rodape">Gerado com LexCalc &mdash; Precificação Jurídica Inteligente &mdash; ${dataHoje}</div>
</body>
</html>`
}

export default function PropostaGen() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()

  const propostaInicial = location.state?.proposta

  const [clientes, setClientes] = useState([])
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(0.6)

  const [form, setForm] = useState({
    tipoAcao: propostaInicial?.tipo_acao || '',
    clienteId: propostaInicial?.cliente_id || '',
    clienteNome: propostaInicial?.clienteNome || '',
    clienteEmail: '',
    honorarioBase: propostaInicial?.honorario_base || 0,
    horas: propostaInicial?.horas || 0,
    valorHora: propostaInicial?.valor_hora || 450,
    complexidade: propostaInicial?.fator_complexidade || 1.3,
    impostoPct: propostaInicial?.imposto_pct || 13.33,
    parcelamento: propostaInicial?.parcelamento || 'À vista',
    observacoes: propostaInicial?.observacoes || '',
    status: propostaInicial?.status || 'rascunho',
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

  useEffect(() => {
    if (!user) return
    supabase.from('clientes').select('id, nome, email').eq('user_id', user.id).order('nome')
      .then(({ data }) => setClientes(data || []))
  }, [user])

  // Preenche nome/email quando seleciona cliente existente
  const handleSelectCliente = (id) => {
    set('clienteId', id)
    const c = clientes.find((c) => c.id === id)
    if (c) {
      set('clienteNome', c.nome)
      set('clienteEmail', c.email || '')
    }
  }

  // Resolve cliente antes de salvar — cria se nome digitado não existe na base
  const resolveClienteId = async () => {
    if (form.clienteId) return form.clienteId
    if (!form.clienteNome.trim()) return null

    // Busca por nome exato (case insensitive)
    const { data: existing } = await supabase
      .from('clientes')
      .select('id')
      .eq('user_id', user.id)
      .ilike('nome', form.clienteNome.trim())
      .limit(1)
      .single()

    if (existing?.id) return existing.id

    // Cria novo cliente silenciosamente
    const { data: novo } = await supabase
      .from('clientes')
      .insert({ user_id: user.id, nome: form.clienteNome.trim(), email: form.clienteEmail || null })
      .select('id')
      .single()

    if (novo?.id) {
      setClientes((prev) => [...prev, { id: novo.id, nome: form.clienteNome.trim(), email: form.clienteEmail }])
      return novo.id
    }

    return null
  }

  const handleSalvar = async () => {
    if (!user) return
    setSaving(true)
    setError('')

    const clienteId = await resolveClienteId()

    const payload = {
      user_id: user.id,
      cliente_id: clienteId,
      tipo_acao: form.tipoAcao,
      horas: num(form.horas),
      valor_hora: num(form.valorHora),
      honorario_base: num(form.honorarioBase),
      fator_complexidade: num(form.complexidade),
      imposto_pct: num(form.impostoPct),
      parcelamento: form.parcelamento,
      valor_total: result.precoFinal,
      observacoes: form.observacoes,
      status: form.status,
      updated_at: new Date().toISOString(),
    }

    let err
    if (propostaInicial?.id) {
      ;({ error: err } = await supabase.from('propostas').update(payload).eq('id', propostaInicial.id))
    } else {
      ;({ error: err } = await supabase.from('propostas').insert(payload))
    }

    setSaving(false)
    if (err) { setError('Erro ao salvar: ' + err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportPDF = async () => {
    setExporting(true)
    setError('')
    try {
      const mod = await import('html2pdf.js')
      // html2pdf.js é UMD — default export pode ser o próprio módulo
      const html2pdf = mod.default ?? mod

      const html = gerarHTMLProposta({ form, result, profile: profile || {} })
      const filename = `Proposta_LexCalc_${(form.clienteNome || 'Cliente').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(html)
        .save()
    } catch (e) {
      setError('Erro ao gerar PDF: ' + e.message)
    }
    setExporting(false)
  }

  const previewHTML = gerarHTMLProposta({ form, result, profile: profile || {} })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--lex-text-2)' }}
          onClick={() => navigate('/propostas')}
          title="Voltar"
        >
          <Icon name="arrowRight" size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--lex-navy)' }}>
            {propostaInicial ? `Proposta #${String(propostaInicial.numero || '').padStart(4, '0')}` : 'Nova Proposta'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="lex-btn-ghost" onClick={handleSalvar} disabled={saving}>
            {saving
              ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lex-text-2)', borderTopColor: 'transparent' }} />
              : saved ? <Icon name="check" size={15} /> : <Icon name="save" size={15} />}
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
          <button className="lex-btn-primary" onClick={handleExportPDF} disabled={exporting}>
            {exporting
              ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
              : <Icon name="download" size={15} />}
            Exportar PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--lex-danger-bg)', color: 'var(--lex-danger)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="lex-card p-6 space-y-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Dados da Proposta</h2>

            <div>
              <label className="lex-label">Tipo de Ação / Serviço</label>
              <input
                className="lex-input"
                placeholder="Ex: Ação Trabalhista, Inventário..."
                value={form.tipoAcao}
                onChange={(e) => set('tipoAcao', e.target.value)}
              />
            </div>

            {/* Cliente — sempre input livre + select opcional */}
            <div className="space-y-2">
              <div>
                <label className="lex-label">Nome do Cliente</label>
                <input
                  className="lex-input"
                  placeholder="Digite o nome do cliente..."
                  value={form.clienteNome}
                  onChange={(e) => {
                    set('clienteNome', e.target.value)
                    set('clienteId', '') // libera vínculo ao digitar livremente
                  }}
                />
              </div>
              {clientes.length > 0 && (
                <div>
                  <label className="lex-label" style={{ opacity: 0.7 }}>Ou selecionar cadastrado</label>
                  <select
                    className="lex-select"
                    value={form.clienteId}
                    onChange={(e) => handleSelectCliente(e.target.value)}
                  >
                    <option value="">— escolher da lista —</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="lex-label">E-mail do Cliente</label>
              <input
                className="lex-input"
                type="email"
                placeholder="cliente@email.com"
                value={form.clienteEmail}
                onChange={(e) => set('clienteEmail', e.target.value)}
              />
            </div>

            <div>
              <label className="lex-label">Status</label>
              <select className="lex-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="rascunho">Rascunho</option>
                <option value="enviada">Enviada</option>
                <option value="aceita">Aceita</option>
                <option value="recusada">Recusada</option>
              </select>
            </div>
          </div>

          <div className="lex-card p-6 space-y-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--lex-navy)' }}>Valores</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lex-label">Honorário Base (R$)</label>
                <input type="number" step="0.01" min="0" className="lex-input" value={form.honorarioBase} onChange={(e) => set('honorarioBase', e.target.value)} />
              </div>
              <div>
                <label className="lex-label">Horas</label>
                <input type="number" step="0.5" min="0" className="lex-input" value={form.horas} onChange={(e) => set('horas', e.target.value)} />
              </div>
              <div>
                <label className="lex-label">Valor/Hora (R$)</label>
                <input type="number" step="0.01" min="0" className="lex-input" value={form.valorHora} onChange={(e) => set('valorHora', e.target.value)} />
              </div>
              <div>
                <label className="lex-label">Complexidade</label>
                <select className="lex-select" value={form.complexidade} onChange={(e) => set('complexidade', e.target.value)}>
                  <option value={1.0}>Simples (1.0×)</option>
                  <option value={1.3}>Intermediário (1.3×)</option>
                  <option value={1.5}>Complexo (1.5×)</option>
                </select>
              </div>
              <div>
                <label className="lex-label">Impostos (%)</label>
                <input type="number" step="0.01" min="0" max="100" className="lex-input" value={form.impostoPct} onChange={(e) => set('impostoPct', e.target.value)} />
              </div>
              <div>
                <label className="lex-label">Parcelamento</label>
                <select className="lex-select" value={form.parcelamento} onChange={(e) => set('parcelamento', e.target.value)}>
                  {PARCELAMENTOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'var(--lex-blue-soft)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--lex-blue)' }}>Valor Total</div>
                  <div className="lex-value-lg" style={{ color: 'var(--lex-navy)', fontSize: '1.75rem' }}>{fmtBRL(result.precoFinal)}</div>
                </div>
                {form.parcelamento !== 'À vista' && (
                  <div className="text-right">
                    <div className="text-xs" style={{ color: 'var(--lex-blue)' }}>{form.parcelamento}</div>
                    <div className="font-semibold text-lg" style={{ color: 'var(--lex-blue)' }}>{fmtBRL(result.valorParcela)}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="lex-label">Observações / Escopo adicional</label>
              <textarea
                className="lex-input resize-none"
                rows={3}
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Informações adicionais que aparecerão na proposta..."
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lex-card overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
          {/* Preview header com zoom */}
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--lex-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--lex-navy)' }}>Preview</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))}
                className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-colors hover:bg-gray-100"
                style={{ color: 'var(--lex-text-2)' }}
                title="Diminuir zoom"
              >−</button>
              <span className="text-xs font-semibold w-10 text-center" style={{ color: 'var(--lex-text-2)' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.2, +(z + 0.1).toFixed(1)))}
                className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-colors hover:bg-gray-100"
                style={{ color: 'var(--lex-text-2)' }}
                title="Aumentar zoom"
              >+</button>
            </div>
          </div>

          {/* Preview area — iframe isolado, sem overflow lateral */}
          <div
            className="flex-1 overflow-auto"
            style={{ background: '#dde1e7', padding: '16px 0' }}
          >
            {/* Wrapper com dimensões exatas do iframe escalado — evita overflow */}
            <div style={{
              margin: '0 auto',
              width: Math.round(A4_W * zoom),
              height: Math.round(A4_H * zoom),
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
            }}>
              <iframe
                srcDoc={previewHTML}
                title="Preview da proposta"
                scrolling="no"
                style={{
                  display: 'block',
                  width: A4_W,
                  height: A4_H,
                  border: 'none',
                  transformOrigin: 'top left',
                  transform: `scale(${zoom})`,
                  background: 'white',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
