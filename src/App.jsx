import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Precificador from './pages/Precificador'
import Propostas from './pages/Propostas'
import PropostaGen from './pages/PropostaGen'
import Clientes from './pages/Clientes'
import Configuracoes from './pages/Configuracoes'
import ResetPasswordPage from './pages/ResetPasswordPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--lex-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--lex-blue)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--lex-text-3)' }}>Carregando...</span>
        </div>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="precificador" element={<Precificador />} />
        <Route path="propostas" element={<Propostas />} />
        <Route path="propostas/nova" element={<PropostaGen />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
    </Routes>
  )
}
