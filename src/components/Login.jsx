import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Lock, Mail, LogIn, UserPlus, AlertCircle } from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState(null)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
        } catch (error) {
            setErrorMsg(error.error_description || error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        if (password.length < 6) {
            setErrorMsg('A senha deve ter pelo menos 6 caracteres.')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) throw error
            alert('Cadastro realizado com sucesso! Você já pode entrar.')
        } catch (error) {
            setErrorMsg(error.error_description || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gold-500 mb-2">Marcia Mata</h1>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Style Manager</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3 text-red-500">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{errorMsg}</span>
                    </div>
                )}

                <form className="space-y-6">
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gold-500 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gold-500 w-5 h-5" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <p className="text-gray-600 text-xs mt-1 text-right">Mínimo 6 caracteres</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="flex-1 bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? '...' : <><LogIn size={18} /> Entrar</>}
                        </button>
                        <button
                            onClick={handleSignUp}
                            disabled={loading}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? '...' : <><UserPlus size={18} /> Cadastrar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
