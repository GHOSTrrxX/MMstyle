import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Save, DollarSign, Calendar, User, Scissors } from 'lucide-react'

export default function DailyLog() {
    const [employees, setEmployees] = useState([])
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        employee_id: '',
        service_id: '',
        service_name: '', // Kept for custom/fallback or to store the name
        commission_percentage: '',
        total_amount: '',
        date: new Date().toISOString().split('T')[0]
    })
    const [calculation, setCalculation] = useState(null)

    useEffect(() => {
        fetchEmployees()
        fetchServices()
    }, [])

    useEffect(() => {
        calculateSplits()
    }, [formData.employee_id, formData.service_id, formData.total_amount, formData.commission_percentage])

    // Auto-fill commission percentage when Employee changes
    useEffect(() => {
        if (formData.employee_id) {
            const employee = employees.find(e => e.id === parseInt(formData.employee_id))
            if (employee) {
                // Only set if not already set or if we want to reset on employee change
                // For now, let's reset to employee default if no service is selected
                if (!formData.service_id) {
                    setFormData(prev => ({ ...prev, commission_percentage: employee.commission_percentage }))
                }
            }
        }
    }, [formData.employee_id])

    // Auto-fill commission percentage when Service changes
    useEffect(() => {
        if (formData.service_id) {
            const service = services.find(s => s.id === parseInt(formData.service_id))
            if (service) {
                setFormData(prev => ({ ...prev, commission_percentage: service.commission_percentage }))
            }
        } else if (formData.employee_id) {
            // Revert to employee default if service is deselected
            const employee = employees.find(e => e.id === parseInt(formData.employee_id))
            if (employee) {
                setFormData(prev => ({ ...prev, commission_percentage: employee.commission_percentage }))
            }
        }
    }, [formData.service_id])

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('active', true)
                .order('name')

            if (error) throw error
            setEmployees(data)
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('active', true)
                .order('name')

            if (error) throw error
            setServices(data || [])
        } catch (error) {
            console.error('Error fetching services:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSplits = () => {
        if (!formData.employee_id || !formData.total_amount) {
            setCalculation(null)
            return
        }

        const employee = employees.find(e => e.id === parseInt(formData.employee_id))
        if (!employee) return

        const total = parseFloat(formData.total_amount)
        if (isNaN(total)) return

        // Determine commission rate: Use the manually edited percentage
        let rate = parseFloat(formData.commission_percentage)
        if (isNaN(rate)) rate = 0

        let serviceName = formData.service_name

        if (formData.service_id) {
            const service = services.find(s => s.id === parseInt(formData.service_id))
            if (service) {
                serviceName = service.name
            }
        }

        const employeeAmount = total * (rate / 100)
        const companyAmount = total - employeeAmount

        setCalculation({
            employeeName: employee.name,
            serviceName,
            rate,
            employeeAmount,
            companyAmount
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!calculation) return

        try {
            const { error } = await supabase
                .from('transactions')
                .insert([{
                    employee_id: parseInt(formData.employee_id),
                    service_name: calculation.serviceName || formData.service_name,
                    total_amount: parseFloat(formData.total_amount),
                    employee_amount: calculation.employeeAmount,
                    company_amount: calculation.companyAmount,
                    created_at: new Date(formData.date).toISOString()
                }])

            if (error) throw error

            alert('Serviço registrado com sucesso!')
            setFormData({
                ...formData,
                service_id: '',
                service_name: '',
                // commission_percentage: '', // Optional: keep last used or reset? Let's reset if we clear employee
                total_amount: ''
            })
            setCalculation(null)
        } catch (error) {
            console.error('Error logging service:', error)
            alert('Erro ao registrar serviço')
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-800">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <span className="bg-gold-500 text-black p-2 rounded-lg"><Scissors size={24} /></span>
                    Novo Registro de Serviço
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date Selection */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Data</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-3.5 text-gold-500 w-5 h-5" />
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Stylist Selection */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Colaborador</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gold-500 w-5 h-5" />
                            <select
                                required
                                value={formData.employee_id}
                                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors appearance-none"
                            >
                                <option value="">Selecione o Colaborador...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service Selection */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Serviço</label>
                        <div className="relative">
                            <Scissors className="absolute left-4 top-3.5 text-gold-500 w-5 h-5" />
                            <select
                                value={formData.service_id}
                                onChange={(e) => setFormData({ ...formData, service_id: e.target.value, service_name: '' })}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors appearance-none"
                            >
                                <option value="">Outro (Digitar Manualmente)</option>
                                {services.map(svc => (
                                    <option key={svc.id} value={svc.id}>{svc.name} ({svc.commission_percentage}%)</option>
                                ))}
                            </select>
                        </div>

                        {/* Manual Entry Fallback */}
                        {!formData.service_id && (
                            <input
                                type="text"
                                placeholder="Descrição do Serviço (Manual)"
                                value={formData.service_name}
                                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 mt-2 text-white focus:border-gold-500 focus:outline-none transition-colors"
                            />
                        )}
                    </div>

                    {/* Commission Percentage (Editable) */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Comissão (%)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gold-500 font-bold">%</span>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                value={formData.commission_percentage}
                                onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Valor Total</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-3.5 text-gold-500 w-5 h-5" />
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.total_amount}
                                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Live Calculation Preview */}
                    {calculation && (
                        <div className="bg-black/50 rounded-lg p-6 border border-gray-800 animate-fade-in">
                            <h3 className="text-gold-500 font-bold mb-4 text-sm uppercase tracking-wider">Divisão de Pagamento</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                    <p className="text-gray-400 text-xs uppercase mb-1">
                                        Colaborador ({calculation.rate}%)
                                        {formData.service_id && <span className="text-gold-500 ml-1 text-[10px]">(Serviço)</span>}
                                    </p>
                                    <p className="text-xl font-bold text-white">R$ {calculation.employeeAmount.toFixed(2)}</p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Salão ({(100 - calculation.rate)}%)</p>
                                    <p className="text-xl font-bold text-white">R$ {calculation.companyAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!calculation}
                        className={`w-full font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg ${calculation
                            ? 'bg-gold-500 hover:bg-gold-600 text-black shadow-gold-500/20'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Save size={20} />
                        Registrar Transação
                    </button>
                </form>
            </div>
        </div>
    )
}
