import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Employees from './components/Employees'
import DailyLog from './components/DailyLog'
import Reports from './components/Reports'
import Login from './components/Login'
import Services from './components/Services'
import { Users, ClipboardList, BarChart3, LogOut, Scissors } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('dailyLog')
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderContent = () => {
    if (!supabase) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-500 mb-2">Configuração Ausente</h2>
            <p className="text-gray-300 mb-4">
              Por favor, crie um arquivo <code className="bg-black px-2 py-1 rounded text-gold-500">.env</code> na raiz do projeto com suas chaves do Supabase.
            </p>
            <p className="text-sm text-gray-500">
              Veja instrucciones.md para detalhes.
            </p>
          </div>
        </div>
      )
    }

    if (!session) {
      return <Login />
    }

    const role = session?.user?.user_metadata?.role || 'user'
    const isAdmin = role === 'admin'

    // Define allowed tabs based on role
    const allowedTabs = isAdmin
      ? ['dailyLog', 'employees', 'services', 'reports']
      : ['dailyLog', 'services']

    // Security check: if user tries to access a restricted tab, show Access Denied or fallback
    if (!allowedTabs.includes(activeTab)) {
      return <DailyLog />
    }

    switch (activeTab) {
      case 'employees':
        return <Employees />
      case 'services':
        return <Services />
      case 'reports':
        return <Reports />
      case 'dailyLog':
      default:
        return <DailyLog />
    }
  }

  // If not logged in, render only the content (which will be Login or Error)
  // This avoids showing the header/nav when on Login screen
  if (session && supabase) {
    const role = session?.user?.user_metadata?.role || 'user'
    const isAdmin = role === 'admin'

    return (
      <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-gold-500 selection:text-black">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gold-500 tracking-tight">
                Marcia Mata <span className="text-gray-500 text-sm font-normal ml-2">Style Manager</span>
              </h1>
              <p className="text-xs text-gray-600 mt-1 uppercase tracking-wider">
                Logado como: <span className={isAdmin ? "text-gold-500 font-bold" : "text-gray-400"}>{role === 'admin' ? 'Administrador' : 'Colaborador'}</span>
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>

          {/* Navigation */}
          <nav className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dailyLog')}
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'dailyLog'
                ? 'border-gold-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              <ClipboardList size={18} /> Registro Diário
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('employees')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'employees'
                  ? 'border-gold-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Users size={18} /> Funcionários
              </button>
            )}

            <button
              onClick={() => setActiveTab('services')}
              className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'services'
                ? 'border-gold-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
              <Scissors size={18} /> Serviços
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reports'
                  ? 'border-gold-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
              >
                <BarChart3 size={18} /> Relatórios
              </button>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {renderContent()}
        </main>
      </div>
    )
  }

  // Render for non-authenticated state (Login or Error)
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-gold-500 selection:text-black">
      {renderContent()}
    </div>
  )
}

export default App
