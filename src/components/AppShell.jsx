import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--lex-bg)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="lex-overlay md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: '248px', zIndex: 60 }}>
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Topbar */}
      <Topbar onMenuClick={() => setMobileOpen(true)} />

      {/* Main content */}
      <main
        className="min-h-screen"
        style={{
          marginLeft: 'var(--sidebar-width)',
          paddingTop: 'var(--topbar-height)',
        }}
      >
        {/* Mobile: no margin */}
        <style>{`
          @media (max-width: 768px) {
            main { margin-left: 0 !important; }
            header { left: 0 !important; }
          }
        `}</style>
        <div style={{ padding: '28px 32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
