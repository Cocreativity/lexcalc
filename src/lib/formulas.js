/**
 * LexCalc — Fórmulas de precificação jurídica
 * Preservar estas fórmulas exatamente — são a base do produto.
 */

/**
 * Calcula honorários diretos com gross-up de imposto.
 * @param {Object} params
 * @param {number} params.honorarioBase  - Honorário base fixo
 * @param {number} params.horas          - Horas estimadas
 * @param {number} params.valorHora      - Valor por hora
 * @param {number} params.complexidade   - Fator: 1.0 (simples), 1.3 (intermediário), 1.5 (complexo)
 * @param {number} params.impostoPct     - Percentual de imposto (ex: 13.33)
 * @param {number} params.parcelas       - Número de parcelas
 */
export function calcHonorarios({ honorarioBase, horas, valorHora, complexidade, impostoPct, parcelas }) {
  const custoOperacional = honorarioBase + horas * valorHora
  const subtotal = custoOperacional * complexidade
  // Gross-up: o imposto é calculado sobre o preço final, não adicionado sobre o subtotal
  const precoFinal = subtotal / (1 - impostoPct / 100)
  const valorParcela = precoFinal / (parcelas || 1)
  return { custoOperacional, subtotal, precoFinal, valorParcela }
}

/**
 * Pesos de probabilidade para o simulador de êxito.
 */
export const PROB_WEIGHTS = {
  Alta: 1.0,
  Média: 0.5,
  Baixa: 0.25,
}

/**
 * Calcula lucro esperado de um caso de êxito.
 * @param {Object} params
 * @param {number} params.proveito       - Valor do proveito econômico
 * @param {number} params.percExito      - Percentual de honorários de êxito (ex: 30)
 * @param {string} params.probabilidade  - "Alta" | "Média" | "Baixa"
 * @param {number} params.meses          - Prazo estimado em meses
 */
export function calcCasoExito({ proveito, percExito, probabilidade, meses }) {
  const lucro = proveito * (percExito / 100) * (PROB_WEIGHTS[probabilidade] ?? 1.0)
  const rendaMensal = lucro / (meses || 1)
  return { lucro, rendaMensal }
}

/**
 * Calcula totais do simulador de êxito a partir de uma lista de casos.
 * @param {Array} casos - Array de objetos com campos de calcCasoExito
 */
export function calcTotaisExito(casos) {
  const computed = casos.map((c) => calcCasoExito(c))
  return {
    totalEsperado: computed.reduce((s, c) => s + c.lucro, 0),
    mediaMensal: computed.reduce((s, c) => s + c.rendaMensal, 0),
  }
}

/**
 * Formata número como moeda BRL.
 */
export const fmtBRL = (n) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * Formata número como percentual pt-BR.
 */
export const fmtPct = (n) =>
  (n ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

/**
 * Formata data ISO para pt-BR.
 */
export const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

/**
 * Labels de complexidade.
 */
export const COMPLEXIDADE_LABELS = {
  1.0: 'Simples',
  1.3: 'Intermediário',
  1.5: 'Complexo',
}

/**
 * Labels de parcelamento.
 */
export const PARCELAMENTOS = [
  'À vista',
  '2x',
  '3x',
  '4x',
  '6x',
  '8x',
  '10x',
  '12x',
]

export const parcelasFromLabel = (label) => {
  if (label === 'À vista') return 1
  return parseInt(label.replace('x', ''), 10) || 1
}
