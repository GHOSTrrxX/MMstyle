import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import { Download, Filter, FileText, TrendingUp, Trash2 } from 'lucide-react'

export default function Reports() {
    const [transactions, setTransactions] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({
        employee_id: '',
        startDate: '',
        endDate: ''
    })

    useEffect(() => {
        fetchEmployees()
        fetchTransactions()
    }, [])

    const fetchEmployees = async () => {
        const { data } = await supabase.from('employees').select('*').order('name')
        setEmployees(data || [])
    }

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('transactions')
                .select(`
          *,
          employees (name)
        `)
                .order('created_at', { ascending: false })

            if (filters.employee_id) {
                query = query.eq('employee_id', filters.employee_id)
            }
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters.endDate) {
                query = query.lte('created_at', `${filters.endDate}T23:59:59`)
            }

            const { data, error } = await query
            if (error) throw error
            setTransactions(data || [])

        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) return

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            setTransactions(transactions.filter(t => t.id !== id))
        } catch (error) {
            console.error('Error deleting transaction:', error)
            alert('Erro ao excluir transação')
        }
    }

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value })
    }

    const applyFilters = (e) => {
        e.preventDefault()
        fetchTransactions()
    }

    const exportPayroll = () => {
        const wb = XLSX.utils.book_new()

        if (filters.employee_id) {
            // Single employee selected: Export just that sheet
            const employeeName = employees.find(e => e.id === parseInt(filters.employee_id))?.name || "Funcionario"
            const data = transactions.map(t => ({
                Data: new Date(t.created_at).toLocaleDateString('pt-BR'),
                Estilista: t.employees?.name,
                Serviço: t.service_name,
                'Valor Total': t.total_amount,
                'Comissão': t.employee_amount
            }))
            const ws = XLSX.utils.json_to_sheet(data)
            XLSX.utils.book_append_sheet(wb, ws, employeeName.substring(0, 30))
        } else {
            // No employee selected: Export ONE SHEET PER EMPLOYEE present in the transactions
            const uniqueEmployeeIds = [...new Set(transactions.map(t => t.employee_id))]

            if (uniqueEmployeeIds.length === 0) {
                alert("Não há dados para exportar.")
                return
            }

            uniqueEmployeeIds.forEach(empId => {
                const empTransactions = transactions.filter(t => t.employee_id === empId)
                const empName = empTransactions[0]?.employees?.name || `ID ${empId}`

                const data = empTransactions.map(t => ({
                    Data: new Date(t.created_at).toLocaleDateString('pt-BR'),
                    Estilista: t.employees?.name,
                    Serviço: t.service_name,
                    'Valor Total': t.total_amount,
                    'Comissão': t.employee_amount
                }))

                const ws = XLSX.utils.json_to_sheet(data)
                // Sheet names max 31 chars
                XLSX.utils.book_append_sheet(wb, ws, empName.substring(0, 30))
            })
        }

        XLSX.writeFile(wb, "Relatorio_Pagamento_Individual.xlsx")
    }

    const exportBalance = () => {
        const data = transactions.map(t => ({
            ID: t.id,
            Data: new Date(t.created_at).toLocaleString('pt-BR'),
            Estilista: t.employees?.name,
            Serviço: t.service_name,
            'Receita Total': t.total_amount,
            'Pagamento Estilista': t.employee_amount,
            'Receita Salão': t.company_amount
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Balanço Geral")
        XLSX.writeFile(wb, "Balanco_Geral.xlsx")
    }

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0)
    const totalPayout = transactions.reduce((sum, t) => sum + t.employee_amount, 0)
    const totalCompany = transactions.reduce((sum, t) => sum + t.company_amount, 0)

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500"><DollarSignIcon /></div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Receita Total</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><UserIcon /></div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Pagamento Estilistas</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {totalPayout.toFixed(2)}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><TrendingUp /></div>
                        <h3 className="text-gray-400 text-sm font-bold uppercase">Lucro Salão</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">R$ {totalCompany.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
                <form onSubmit={applyFilters} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Estilista</label>
                        <select
                            name="employee_id"
                            value={filters.employee_id}
                            onChange={handleFilterChange}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 focus:outline-none"
                        >
                            <option value="">Todos os Estilistas</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Data Início</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-gray-400 text-xs font-bold mb-1 uppercase">Data Fim</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 focus:outline-none"
                        />
                    </div>
                    <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                        <Filter size={18} /> Filtrar
                    </button>
                </form>
            </div>

            {/* Data Table */}
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
                <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-gold-500" /> Histórico de Transações
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={exportPayroll} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                            <Download size={16} /> Folha (.xlsx)
                        </button>
                        <button
                            onClick={() => {
                                const headers = ['Data', 'Estilista', 'Serviço', 'Total', 'Comissão', 'Salão'].join('\t')
                                const rows = transactions.map(t => [
                                    new Date(t.created_at).toLocaleDateString('pt-BR'),
                                    t.employees?.name,
                                    t.service_name,
                                    t.total_amount.toFixed(2).replace('.', ','),
                                    t.employee_amount.toFixed(2).replace('.', ','),
                                    t.company_amount.toFixed(2).replace('.', ',')
                                ].join('\t')).join('\n')

                                navigator.clipboard.writeText(`${headers}\n${rows}`)
                                alert('Dados copiados! Agora abra o Google Sheets e pressione Ctrl+V')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                        >
                            <FileText size={16} /> Copiar p/ Sheets
                        </button>
                        <button onClick={exportBalance} className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                            <Download size={16} /> Balanço (.xlsx)
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-black text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4">Data</th>
                                <th className="p-4">Estilista</th>
                                <th className="p-4">Serviço</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-right">Parte Estilista</th>
                                <th className="p-4 text-right">Parte Salão</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Carregando dados...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Nenhuma transação encontrada.</td></tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-black/30 transition-colors text-sm">
                                        <td className="p-4 text-gray-300">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-white font-medium">{t.employees?.name}</td>
                                        <td className="p-4 text-gray-300">{t.service_name}</td>
                                        <td className="p-4 text-right text-white font-bold">R$ {t.total_amount.toFixed(2)}</td>
                                        <td className="p-4 text-right text-blue-400">R$ {t.employee_amount.toFixed(2)}</td>
                                        <td className="p-4 text-right text-gold-500">R$ {t.company_amount.toFixed(2)}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                                title="Excluir Transação"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// Simple icons for stats
const DollarSignIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
)
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
)
