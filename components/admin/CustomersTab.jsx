'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, X, Crown, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { getCustomers } from '@/lib/server-actions'
import toast from 'react-hot-toast'

const VIP_THRESHOLD = 10000 // MXN

function CustomerDetailModal({ customer, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-stone-200 max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl text-stone-800">Historial del Cliente</h3>
                {customer.totalSpent >= VIP_THRESHOLD && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    <Crown size={9} /> VIP
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 mt-1">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 bg-white p-1.5 rounded-full border border-stone-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Pedidos</p>
              <p className="text-2xl font-serif text-stone-800">{customer.orderCount}</p>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Total</p>
              <p className="text-lg font-serif text-stone-800">${customer.totalSpent.toLocaleString('es-MX')}</p>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Último</p>
              <p className="text-xs text-stone-600 mt-1">
                {new Date(customer.lastPurchase).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Order history */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-3">Pedidos</p>
            <div className="space-y-3">
              {customer.orders.map(order => (
                <div key={order.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                  {order.product?.image && (
                    <div className="relative w-10 h-[53px] rounded-lg overflow-hidden shrink-0">
                      <Image src={order.product.image} alt={order.product.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">{order.product?.name}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 font-mono">#{order.stripeSessionId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-stone-800">${order.total.toLocaleString('es-MX')}</p>
                    <p className="text-[9px] text-stone-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCustomers()
        setCustomers(data)
      } catch {
        toast.error('Error al cargar clientes')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const vipCount = customers.filter(c => c.totalSpent >= VIP_THRESHOLD).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-stone-800">Clientes</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{customers.length} cliente{customers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-stone-400" />
            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Total Clientes</p>
          </div>
          <p className="font-serif text-2xl text-stone-800">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-stone-400" />
            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Ingresos Totales</p>
          </div>
          <p className="font-serif text-2xl text-stone-800">${totalRevenue.toLocaleString('es-MX')}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-amber-500" />
            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Clientes VIP</p>
          </div>
          <p className="font-serif text-2xl text-stone-800">{vipCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-600 animate-spin rounded-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <Users size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No hay clientes aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Cliente</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Pedidos</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Total Gastado</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400 hidden md:table-cell">Última Compra</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.email} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-800 text-xs">{customer.email}</span>
                        {customer.totalSpent >= VIP_THRESHOLD && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-bold uppercase tracking-widest">
                            <Crown size={7} /> VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-600 text-xs">{customer.orderCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-800 font-medium text-xs">${customer.totalSpent.toLocaleString('es-MX')} <span className="text-stone-400 text-[9px]">MXN</span></span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-stone-400 text-xs">
                        {new Date(customer.lastPurchase).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-[9px] font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900 transition-colors"
                      >
                        Ver Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
