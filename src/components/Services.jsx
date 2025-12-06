import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, Save, X, Scissors } from 'lucide-react'

export default function Services() {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [newService, setNewService] = useState({ name: '', commission_percentage: '' })

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name')

            if (error) throw error
            setServices(data || [])
        } catch (error) {
            console.error('Error fetching services:', error)
            alert('Erro ao carregar serviços')
        } finally {
            setLoading(false)
        }
    }

    const handleAddService = async (e) => {
        e.preventDefault()
        if (!newService.name || !newService.commission_percentage) return

        try {
            const { error } = await supabase
                .from('services')
            name: newService.name,
                commission_percentage: parseInt(newService.commission_percentage),
                    active: true
        }])

        if (error) throw error

        setNewService({ name: '', commission_percentage: '' })
        setIsAdding(false)
        fetchServices()
    } catch (error) {
        console.error('Error adding service:', error)
        alert('Erro ao adicionar serviço')
    }
}


const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id)

        if (error) throw error
        setServices(services.filter(s => s.id !== id))
    } catch (error) {
        console.error('Error deleting service:', error)
        alert('Erro ao excluir serviço')
    }
}

return (
    <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Scissors className="text-gold-500" /> Gerenciar Serviços
            </h2>
            <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-gold-500 hover:bg-gold-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
                {isAdding ? <X size={20} /> : <Plus size={20} />}
                {isAdding ? 'Cancelar' : 'Novo Serviço'}
            </button>
        </div>

        {isAdding && (
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-8 shadow-lg animate-in fade-in slide-in-from-top-4">
                <h3 className="text-gold-500 font-bold mb-4 uppercase text-sm tracking-wider">Adicionar Novo Serviço</h3>
                <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Nome do Serviço</label>
                        <input
                            type="text"
                            value={newService.name}
                            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 focus:outline-none"
                            placeholder="Ex: Corte Masculino"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Comissão (%)</label>
                        <input
                            type="number"
                            value={newService.commission_percentage}
                            onChange={(e) => setNewService({ ...newService, commission_percentage: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 focus:outline-none"
                            placeholder="Ex: 50"
                            min="0"
                            max="100"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Save size={18} /> Salvar
                    </button>
                </form>
            </div>
        )}
    </button>
                                    </td >
                                </tr >
                            ))
                        )}
                    </tbody >
                </table >
            </div >
        </div >
    )
}
