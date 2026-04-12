'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function UserModal({ newUser, setNewUser, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="font-serif text-xl">Nuevo Usuario</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Email</label>
            <input type="email" required value={newUser.email}
              onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))}
              className="w-full border border-stone-300 rounded px-4 py-2 text-sm outline-none focus:border-amber-500"
              placeholder="admin@0880mx.com" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Contraseña</label>
            <input type="password" required minLength={6} value={newUser.password}
              onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
              className="w-full border border-stone-300 rounded px-4 py-2 text-sm outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Rol</label>
            <select value={newUser.role} onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value }))}
              className="w-full border border-stone-300 rounded px-4 py-2 text-sm outline-none focus:border-amber-500 bg-white">
              <option value="admin">Administrador (Acceso Total)</option>
              <option value="editor">Editor (Sólo Catálogo)</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-black text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors mt-4">
            Crear Usuario
          </button>
        </form>
      </motion.div>
    </div>
  )
}
