'use client'

import { useState, useEffect } from 'react'
import { Activity, ChevronDown, ChevronRight } from 'lucide-react'
import { getAuditLogs } from '@/lib/server-actions'

const ACTION_COLORS = {
  CREATE: 'bg-green-50 text-green-700',
  UPDATE: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-700',
}

export default function AuditTab() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [resourceFilter, setResourceFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getAuditLogs({
          resource: resourceFilter || undefined,
          action: actionFilter || undefined,
        })
        setLogs(data)
      } catch {
        // silently fail — parent handles auth
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [resourceFilter, actionFilter])

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-stone-800">Registro de Auditoría</h2>
        <p className="text-sm text-stone-500 mt-1">Historial completo de cambios realizados por los administradores.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="border border-stone-200 rounded px-3 py-2 text-xs bg-white outline-none focus:border-amber-500"
        >
          <option value="">Todos los recursos</option>
          <option value="Product">Productos</option>
          <option value="Config">Configuración</option>
          <option value="User">Usuarios</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-stone-200 rounded px-3 py-2 text-xs bg-white outline-none focus:border-amber-500"
        >
          <option value="">Todas las acciones</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
        </select>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-black animate-spin rounded-full mx-auto mb-3"></div>
            <p className="text-xs text-stone-400">Cargando registros...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-stone-400 flex flex-col items-center">
            <Activity size={32} className="text-stone-200 mb-3" />
            <p className="text-sm">No hay registros de auditoría.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-widest text-stone-500">
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Usuario</th>
                  <th className="p-4 font-semibold">Acción</th>
                  <th className="p-4 font-semibold">Recurso</th>
                  <th className="p-4 font-semibold">ID</th>
                  <th className="p-4 font-semibold">Cambios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-4 text-[10px] text-stone-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-xs text-stone-700">{log.user?.email || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${ACTION_COLORS[log.action] || 'bg-stone-100 text-stone-600'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-stone-600 font-medium">{log.resource}</td>
                      <td className="p-4 text-[10px] text-stone-400 font-mono">{log.resourceId}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="flex items-center gap-1 text-[10px] text-amber-700 hover:underline font-bold"
                        >
                          {expandedId === log.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          Ver diff
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-expanded`} className="bg-stone-50">
                        <td colSpan={6} className="px-6 pb-4 pt-2">
                          <pre className="text-[10px] text-stone-600 bg-white border border-stone-200 rounded-lg p-4 overflow-x-auto max-h-48 font-mono leading-relaxed">
                            {JSON.stringify(JSON.parse(log.changes || '{}'), null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
