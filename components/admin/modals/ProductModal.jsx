'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Image as ImageIcon, Upload } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const { url } = await res.json()
      setForm(prev => ({ ...prev, image: url }))
      toast.success('Imagen subida a Cloudinary')
    } catch (error) {
      toast.error(error.message || 'Error al subir imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center shrink-0">
          <h3 className="font-serif text-2xl">{form.id === 'new' ? 'Agregar Producto' : 'Editar Producto'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-6 items-start">
              {/* Image column */}
              <div className="w-1/3 space-y-2">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">Imagen</label>
                <div className="aspect-[3/4] bg-stone-100 rounded-lg border border-stone-200 border-dashed relative overflow-hidden group">
                  {form.image ? (
                    <Image src={form.image} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-white text-stone-800 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                    >
                      {isUploading ? (
                        <div className="w-3 h-3 border-2 border-stone-400 border-t-stone-800 animate-spin rounded-full" />
                      ) : (
                        <Upload size={12} />
                      )}
                      {isUploading ? 'Subiendo...' : 'Subir archivo'}
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <input
                  type="text"
                  placeholder="O pega una URL de imagen"
                  value={form.image || ''}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full text-[10px] p-2 border border-stone-200 rounded outline-none focus:border-amber-500 mt-2"
                />
              </div>

              {/* Fields column */}
              <div className="w-2/3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Nombre</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Colección</label>
                    <select value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none bg-white">
                      <option value="Valentina">Valentina</option>
                      <option value="Love">Love</option>
                      <option value="Amelia">Amelia</option>
                      <option value="Inés">Inés</option>
                      <option value="Accesorios">Accesorios</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Color</label>
                    <input type="text" required value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Precio ($ MXN)</label>
                    <input type="number" required min="0" step="100" value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Stock Inicial</label>
                    <input type="number" required min="0" value={form.stock || 0}
                      onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="isPublished" checked={!!form.published}
                      onChange={(e) => setForm({ ...form, published: e.target.checked })}
                      className="w-4 h-4 text-amber-600 border-stone-300 rounded" />
                    <label htmlFor="isPublished" className="text-xs font-bold text-stone-700 uppercase tracking-widest cursor-pointer">Publicado</label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Diseño (Bordado / Variante)</label>
                  <input type="text" required value={form.design} onChange={(e) => setForm({ ...form, design: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Descripción (Español)</label>
                  <textarea rows="3" required value={form.descEs || ''} onChange={(e) => setForm({ ...form, descEs: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none resize-none" />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} type="button" className="px-5 py-2 rounded text-stone-600 font-medium hover:bg-stone-200 transition-colors text-sm">
            Cancelar
          </button>
          <button form="productForm" type="submit" className="px-5 py-2 rounded bg-black text-white font-medium hover:bg-stone-800 transition-colors text-sm flex items-center gap-2">
            <Save size={16} /> Guardar Producto
          </button>
        </div>
      </motion.div>
    </div>
  )
}
