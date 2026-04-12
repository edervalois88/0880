'use client'

import { Activity } from 'lucide-react'
import Image from 'next/image'

export default function InventoryTab({ inventoryLogs }) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-stone-800">Historial de Movimientos</h2>
        <p className="text-sm text-stone-500 mt-1">Registro detallado de entradas, salidas y ventas automáticas.</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-widest text-stone-500">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold text-right">Cantidad</th>
                <th className="p-4 font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {inventoryLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="p-4 text-[10px] text-stone-400 font-medium">
                    {new Date(log.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-10 bg-stone-100 rounded overflow-hidden relative border border-stone-200 shrink-0">
                        <Image src={log.product.image} alt="" fill className="object-cover" />
                      </div>
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-tighter">{log.product.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                      log.type === 'IN' ? 'bg-green-50 text-green-700' :
                      log.type === 'SALE' ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {log.type === 'IN' ? 'Entrada' : log.type === 'SALE' ? 'Venta' : 'Salida'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold text-sm ${log.type === 'IN' ? 'text-green-600' : 'text-stone-800'}`}>
                    {log.type === 'IN' ? `+${log.quantity}` : `-${log.quantity}`}
                  </td>
                  <td className="p-4 text-xs text-stone-500 italic">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {inventoryLogs.length === 0 && (
            <div className="p-12 text-center text-stone-400 flex flex-col items-center">
              <Activity size={32} className="text-stone-200 mb-3" />
              <p className="text-sm">No hay registros de movimientos aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
