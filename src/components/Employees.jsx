import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'

export default function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [newEmployee, setNewEmployee] = useState({ name: '', commission_percentage: '' })
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', commission_percentage: '' })

    useEffect(() => {
        fetchEmployees()
    }, [])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('name')

            if (error) throw error
            setEmployees(data)
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddEmployee = async (e) => {
        e.preventDefault()
        if (!newEmployee.name || !newEmployee.commission_percentage) return

        try {
            const { data, error } = await supabase
                .from('employees')
                .insert([{
                    name: newEmployee.name,
                    commission_percentage: parseInt(newEmployee.commission_percentage)
                }])
                .select()

            if (error) throw error

            setEmployees([...employees, data[0]])
            setNewEmployee({ name: '', commission_percentage: '' })
        } catch (error) {
            console.error('Error adding employee:', error)
            alert('Erro ao adicionar funcionário')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este funcionário?')) return

        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id)

            if (error) throw error
            setEmployees(employees.filter(emp => emp.id !== id))
        } catch (error) {
            console.error('Error deleting employee:', error)
            alert('Erro ao excluir funcionário')
        }
    }

    const startEdit = (employee) => {
        setEditingId(employee.id)
        setEditForm({ name: employee.name, commission_percentage: employee.commission_percentage })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm({ name: '', commission_percentage: '' })
    }

    const saveEdit = async (id) => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .update({
                    name: editForm.name,
                    commission_percentage: parseInt(editForm.commission_percentage)
                })
                .eq('id', id)
                .select()

            if (error) throw error

            setEmployees(employees.map(emp => emp.id === id ? data[0] : emp))
            setEditingId(null)
        } catch (error) {
            console.error('Error updating employee:', error)
            alert('Erro ao atualizar funcionário')
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-800 mb-8">
                <h2 className="text-2xl font-bold text-gold-500 mb-6 flex items-center gap-2">
                    <Plus className="w-6 h-6" /> Adicionar Novo Estilista
                </h2>
                <form onSubmit={handleAddEmployee} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Nome do Estilista"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                    />
                    <div className="relative w-full md:w-48">
                        <input
                            type="number"
                            placeholder="Comissão %"
                            value={newEmployee.commission_percentage}
                            onChange={(e) => setNewEmployee({ ...newEmployee, commission_percentage: e.target.value })}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors pr-8"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">%</span>
                    </div>
                    <button
                        type="submit"
                        className="bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-gold-500/20"
                    >
                        Adicionar
                    </button>
                </form>
            </div>

            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Equipe</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando equipe...</div>
                ) : employees.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum estilista adicionado ainda.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-black text-gray-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">Nome</th>
                                    <th className="p-4 font-medium text-center">Taxa de Comissão</th>
                                    <th className="p-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-black/30 transition-colors">
                                        <td className="p-4 text-white font-medium">
                                            {editingId === employee.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="bg-black border border-gray-700 rounded px-2 py-1 text-white w-full"
                                                />
                                            ) : (
                                                employee.name
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {editingId === employee.id ? (
                                                <div className="inline-flex items-center">
                                                    <input
                                                        type="number"
                                                        value={editForm.commission_percentage}
                                                        onChange={(e) => setEditForm({ ...editForm, commission_percentage: e.target.value })}
                                                        className="bg-black border border-gray-700 rounded px-2 py-1 text-white w-20 text-center"
                                                    />
                                                    <span className="ml-1 text-gold-500">%</span>
                                                </div>
                                            ) : (
                                                <span className="bg-gray-800 text-gold-500 px-3 py-1 rounded-full text-sm font-bold">
                                                    {employee.commission_percentage}%
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingId === employee.id ? (
                                                    <>
                                                        <button onClick={() => saveEdit(employee.id)} className="text-green-500 hover:text-green-400 p-2"><Save size={18} /></button>
                                                        <button onClick={cancelEdit} className="text-red-500 hover:text-red-400 p-2"><X size={18} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(employee)} className="text-gray-400 hover:text-white p-2"><Edit2 size={18} /></button>
                                                        <button onClick={() => handleDelete(employee.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
