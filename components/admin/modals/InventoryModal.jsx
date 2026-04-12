'use client'

import { motion } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

export default function InventoryModal({ product, adjustment, setAdjustment, isAdjusting, onClose, onSubmit }) {
  const preview = adjustment.type === 'IN'
    ? product.stock + (parseInt(adjustment.quantity) || 0)
    : product.stock - (parseInt(adjustment.quantity) || 0)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-stone-200"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="font-serif text-xl text-stone-800">Ajustar Inventario</h3>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 bg-white p-1.5 rounded-full border border-stone-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Current vs new stock */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">Stock Actual</p>
              <p className="text-2xl font-serif text-stone-800">{product.stock}</p>
            </div>
            <div className={`p-3 rounded-xl border ${preview < 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className="text-[9px] uppercase tracking-widest text-amber-600 mb-1">Nuevo Stock</p>
              <p className={`text-2xl font-serif ${preview < 0 ? 'text-red-600' : 'text-amber-900'}`}>{preview}</p>
            </div>
          </div>

          {/* IN / OUT toggle */}
          <div className="flex bg-stone-100 p-1 rounded-lg">
            <button type="button" onClick={() => setAdjustment(a => ({ ...a, type: 'IN' }))}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5 ${adjustment.type === 'IN' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-400'}`}>
              <Plus size={12} /> Entrada (+)
            </button>
            <button type="button" onClick={() => setAdjustment(a => ({ ...a, type: 'OUT' }))}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5 ${adjustment.type === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-stone-400'}`}>
              <Trash2 size={12} /> Salida (-)
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Cantidad</label>
            <input type="number" min="1" required value={adjustment.quantity}
              onChange={(e) => setAdjustment(a => ({ ...a, quantity: e.target.value }))}
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-lg font-serif outline-none focus:border-amber-500 bg-stone-50 focus:bg-white" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Motivo de Ajuste (Obligatorio)</label>
            <textarea required value={adjustment.reason}
              onChange={(e) => setAdjustment(a => ({ ...a, reason: e.target.value }))}
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 bg-stone-50 focus:bg-white min-h-[80px] resize-none"
              placeholder="Ej: Reabastecimiento, Ajuste por merma, Error en conteo..." />
          </div>

          <button type="submit" disabled={isAdjusting || !adjustment.reason}
            className="w-full bg-black text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50">
            {isAdjusting ? 'Procesando...' : 'Confirmar Ajuste'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
