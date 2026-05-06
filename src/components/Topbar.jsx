import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const breadcrumbMap = {
  '/': 'Dashboard',
  '/precificador': 'Precificador',
  '/propostas': 'Propostas',
  '/propostas/nova': 'Nova Proposta',
  '/clientes': 'Clientes',
  '/configuracoes': 'Configurações',
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const current = breadcrumbMap[location.pathname] || 'LexCalc'

  return (
    <header
      className="fixed top-0 right-0 flex items-center px-6 gap-4 bg-white border-b z-30"
      style={{
        left: 'var(--sidebar-width)',
        height: 'var(--topbar-height)',
        borderColor: 'var(--lex-border)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        className="p-1.5 rounded-lg md:hidden"
        style={{ color: 'var(--lex-text-2)' }}
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Icon name="menu" size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--lex-navy)' }}>{current}</span>
      </div>

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--lex-border)', background: 'var(--lex-bg)', minWidth: 220 }}>
        <Icon name="search" size={15} className="flex-shrink-0" style={{ color: 'var(--lex-text-3)' }} />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-sm outline-none flex-1 min-w-0"
          style={{ color: 'var(--lex-text)', '::placeholder': { color: 'var(--lex-text-3)' } }}
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-1">
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--lex-text-2)' }}
          title="Notificações"
        >
          <Icon name="bell" size={18} />
        </button>
        <button
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--lex-text-2)' }}
          title="Ajuda"
          onClick={() => navigate('/configuracoes')}
        >
          <Icon name="help" size={18} />
        </button>
      </div>
    </header>
  )
}
