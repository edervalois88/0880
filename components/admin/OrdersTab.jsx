'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Package, Truck, CheckCircle, Clock, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { getOrders, updateOrderFulfillment } from '@/lib/server-actions'
import toast from 'react-hot-toast'

const SHIPPING_STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
]

const STATUS_STYLES = {
  pending: { bg: 'bg-stone-100', text: 'text-stone-600', icon: Clock },
  processing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Package },
  shipped: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${s.bg} ${s.text}`}>
      <Icon size={10} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function OrderDetailModal({ order, onClose }) {
  const [form, setForm] = useState({
    shippingStatus: order.shippingStatus || 'pending',
    trackingNumber: order.trackingNumber || '',
    notes: order.notes || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateOrderFulfillment(order.id, form)
      toast.success('Pedido actualizado')
      onClose(true)
    } catch {
      toast.error('Error al actualizar pedido')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onClose(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-stone-200"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="font-serif text-xl text-stone-800">Detalle del Pedido</h3>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1 font-mono">
              #{order.stripeSessionId.slice(-8).toUpperCase()}
            </p>
          </div>
          <button onClick={() => onClose(false)} className="text-stone-400 hover:text-stone-800 bg-white p-1.5 rounded-full border border-stone-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product */}
          <div className="flex gap-4 items-center p-4 bg-stone-50 rounded-xl border border-stone-100">
            {order.product?.image && (
              <div className="relative w-14 h-[74px] rounded-lg overflow-hidden shrink-0">
                <Image src={order.product.image} alt={order.product.name} fill className="object-cover" />
              </div>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-stone-400">{order.product?.collection}</p>
              <p className="font-serif text-stone-800 mt-0.5">{order.product?.name}</p>
              <p className="text-sm text-stone-600 mt-1">${order.total.toLocaleString('es-MX')} <span className="text-[9px] text-stone-400">MXN</span></p>
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Cliente</p>
            <p className="text-sm text-stone-800">{order.customerEmail}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-stone-500 font-bold mb-2">Estado de Envío</label>
              <div className="relative">
                <select
                  value={form.shippingStatus}
                  onChange={(e) => setForm(f => ({ ...f, shippingStatus: e.target.value }))}
                  className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 bg-white appearance-none pr-10"
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Tracking */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-stone-500 font-bold mb-2">Número de Rastreo</label>
              <input
                type="text"
                value={form.trackingNumber}
                onChange={(e) => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                placeholder="Ej: 1Z999AA10123456784"
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-stone-500 font-bold mb-2">Notas Internas</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas sobre el pedido..."
                rows={3}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders({ search: search || undefined, status: statusFilter })
      setOrders(data)
    } catch {
      toast.error('Error al cargar pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [search, statusFilter])

  const handleModalClose = (didSave) => {
    setSelectedOrder(null)
    if (didSave) loadOrders()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-stone-800">Pedidos</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email..."
            className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {SHIPPING_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                statusFilter === s.value
                  ? 'bg-black text-white'
                  : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-600 animate-spin rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <Package size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No hay pedidos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Pedido</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Producto</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400 hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Total</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400">Envío</th>
                  <th className="text-left px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400 hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-stone-500">#{order.stripeSessionId.slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {order.product?.image && (
                          <div className="relative w-8 h-10 rounded overflow-hidden shrink-0 hidden sm:block">
                            <Image src={order.product.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <span className="text-stone-800 text-xs">{order.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-stone-500 text-xs">{order.customerEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-800 font-medium text-xs">${order.total.toLocaleString('es-MX')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.shippingStatus} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-stone-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[9px] font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900 transition-colors"
                      >
                        Gestionar
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
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={handleModalClose} />
        )}
      </AnimatePresence>
    </div>
  )
}
