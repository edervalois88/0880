'use client'

import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function UsersTab({
  users,
  userPage, setUserPage,
  itemsPerPage,
  onNewUser,
  onUpdateRole,
  onToggleStatus,
  onDeleteUser,
}) {
  const totalPages = Math.ceil(users.length / itemsPerPage)
  const paginated = users.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif text-stone-800">Gestión de Usuarios</h2>
          <p className="text-sm text-stone-500 mt-1">Administra accesos y roles ({users.length} usuarios).</p>
        </div>
        <button
          onClick={onNewUser}
          className="bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
        >
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Rol</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginated.map(user => (
                <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-xs font-bold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-[10px] text-stone-400">{new Date(user.createdAt).toLocaleDateString('es-MX')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateRole(user.id, e.target.value)}
                      className="text-xs border border-stone-200 rounded px-2 py-1 bg-white outline-none focus:border-amber-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${user.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleStatus(user.id, user.active)}
                        className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded transition-colors ${user.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors" title="Eliminar usuario">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs text-stone-500">Total: {users.length} usuarios</p>
          <div className="flex gap-2 items-center">
            <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase px-4">{userPage} / {totalPages}</span>
            <button onClick={() => setUserPage(p => Math.min(totalPages, p + 1))} disabled={userPage === totalPages} className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
