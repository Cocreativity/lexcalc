import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

const navItems = [
  { label: 'Dashboard', path: '/', icon: 'dashboard', exact: true },
  { label: 'Precificador', path: '/precificador', icon: 'calc' },
  { label: 'Propostas', path: '/propostas', icon: 'doc' },
  { label: 'Clientes', path: '/clientes', icon: 'users' },
]

const navBottom = [
  { label: 'Integrações', path: '/integracoes', icon: 'plug', pro: true },
  { label: 'Configurações', path: '/configuracoes', icon: 'settings' },
]

export default function Sidebar({ mobile = false, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { profile } = useProfile()

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  const handleNav = (path) => {
    navigate(path)
    if (onClose) onClose()
  }

  const displayName = profile?.nome || user?.user_metadata?.full_name || user?.email || 'Usuário'
  const oab = profile?.oab || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const plano = profile?.plano || 'free'
  const propostasUsadas = profile?.propostas_mes || 0
  const limitePropostas = plano === 'pro' ? 999 : 5

  return (
    <aside className="lex-sidebar" style={{ width: mobile ? '100%' : undefined }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9"/>
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-wide">LexCalc</span>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Precificação Jurídica</div>
        </div>
        {mobile && (
          <button
            className="ml-auto p-1 rounded"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 pt-3 pb-2">
        <div className="lex-section-title mt-2 mb-1">Menu</div>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`lex-nav-item w-full text-left ${isActive(item) ? 'active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}

        <div className="lex-section-title mt-5 mb-1">Sistema</div>
        {navBottom.map((item) => (
          <button
            key={item.path}
            className={`lex-nav-item w-full text-left ${isActive(item) ? 'active' : ''} ${item.pro ? 'opacity-70' : ''}`}
            onClick={() => !item.pro && handleNav(item.path)}
            disabled={item.pro}
          >
            <Icon name={item.icon} size={18} />
            <span className="flex-1">{item.label}</span>
            {item.pro && (
              <span className="lex-pill-pro text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(128,90,213,0.3)', color: '#c4b5fd', fontSize: '10px' }}>
                PRO
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {/* Plan bar */}
        {plano === 'free' && (
          <div className="mb-3 px-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Propostas este mês</span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {propostasUsadas}/{limitePropostas}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (propostasUsadas / limitePropostas) * 100)}%`,
                  background: propostasUsadas >= limitePropostas ? '#fc8181' : '#63b3ed',
                }}
              />
            </div>
            <div className="mt-1.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Plano Free — <button className="underline" style={{ color: '#c4b5fd' }} onClick={() => handleNav('/configuracoes')}>Upgrade PRO</button>
              </span>
            </div>
          </div>
        )}

        {/* User */}
        <div className="flex items-center gap-2.5 px-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{displayName}</div>
            {oab && <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>OAB {oab}</div>}
          </div>
        </div>
      </div>
    </aside>
  )
}
