'use client'

import { Plus, Search, Grid, List, Database, Box, Edit2, Trash2, ChevronLeft, ChevronRight, Layout } from 'lucide-react'
import Image from 'next/image'

export default function CatalogTab({
  products,
  searchQuery, setSearchQuery,
  stockFilter, setStockFilter,
  catalogViewMode, setCatalogViewMode,
  currentPage, setCurrentPage,
  itemsPerPage,
  isMigrating,
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenInventory,
  onMigrate,
}) {
  const processedProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.color.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(p => {
    if (stockFilter === 'low') return p.stock === 1
    if (stockFilter === 'out') return p.stock === 0
    return true
  })

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage)
  const paginated = processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif text-stone-800">Inventario y Catálogo</h2>
          <p className="text-sm text-stone-500 mt-1">Gestiona tus colecciones, precios y detalles de {products.length} productos.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onNewProduct}
            className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> Nuevo Producto
          </button>
          {products.length === 0 && (
            <button
              onClick={onMigrate}
              disabled={isMigrating}
              className="bg-stone-800 hover:bg-black text-white px-4 py-2 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Database size={16} />
              {isMigrating ? 'Migrando...' : 'Migrar desde constants.js'}
            </button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex-1 flex items-center gap-3">
          <Search className="text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, color o colección..."
            className="flex-1 outline-none text-sm placeholder:text-stone-400"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          />
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-stone-200 shadow-sm gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos', count: products.length },
            { id: 'low', label: 'Bajo Stock', count: products.filter(p => p.stock === 1).length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { id: 'out', label: 'Agotados', count: products.filter(p => p.stock === 0).length, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setStockFilter(f.id); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-tight transition-all flex items-center gap-2 whitespace-nowrap ${
                stockFilter === f.id ? (f.bg || 'bg-stone-800') + ' ' + (f.color || 'text-white') : 'text-stone-400 hover:bg-stone-50'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${stockFilter === f.id ? 'bg-white/20' : 'bg-stone-100'}`}>{f.count}</span>
            </button>
          ))}
        </div>

        <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-sm flex items-center gap-1 shrink-0">
          <button onClick={() => setCatalogViewMode('grid')} className={`p-2 rounded-md transition-colors ${catalogViewMode === 'grid' ? 'bg-stone-100 text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
            <Grid size={18} />
          </button>
          <button onClick={() => setCatalogViewMode('list')} className={`p-2 rounded-md transition-colors ${catalogViewMode === 'list' ? 'bg-stone-100 text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {processedProducts.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-24 text-center text-stone-500 flex flex-col items-center">
          <Layout size={40} className="text-stone-300 mb-4" />
          <p className="font-serif text-xl text-stone-800 mb-2">No se encontraron productos</p>
          <p className="text-xs uppercase tracking-widest text-stone-400">Intenta ajustar los filtros</p>
          <button onClick={() => { setSearchQuery(''); setStockFilter('all') }} className="mt-6 text-amber-700 text-xs font-bold uppercase tracking-widest hover:underline">
            Limpiar filtros
          </button>
        </div>
      ) : catalogViewMode === 'list' ? (
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                  <th className="p-4 font-semibold">Producto</th>
                  <th className="p-4 font-semibold">Colección</th>
                  <th className="p-4 font-semibold">Color / Diseño</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">Precio</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginated.map(product => (
                  <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-stone-100 rounded overflow-hidden relative border border-stone-200 shrink-0">
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        </div>
                        <span className="font-serif text-base text-stone-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4"><span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs">{product.collection}</span></td>
                    <td className="p-4">
                      <div className="text-sm text-stone-800">{product.color}</div>
                      <div className="text-xs text-stone-500">{product.design}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${product.stock === 0 ? 'bg-red-500 animate-pulse' : product.stock === 1 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                        <span className={`text-[11px] font-bold ${product.stock === 0 ? 'text-red-600' : product.stock === 1 ? 'text-amber-700' : 'text-stone-600'}`}>
                          {product.stock === 0 ? 'AGOTADO' : product.stock === 1 ? '¡ÚLTIMA!' : `${product.stock} disp.`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">${product.price.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onOpenInventory(product)} className="text-stone-400 hover:text-green-600 p-2 transition-colors" title="Ajustar Stock">
                          <Box size={16} />
                        </button>
                        <button onClick={() => onEditProduct(product)} className="text-stone-400 hover:text-amber-700 p-2 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDeleteProduct(product.id)} className="text-stone-400 hover:text-red-600 p-2 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginated.map(product => (
            <div key={product.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="relative h-64 bg-stone-100">
                <Image src={product.image} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.stock === 0 ? (
                    <span className="bg-red-600 text-white text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest">Agotado</span>
                  ) : product.stock === 1 ? (
                    <span className="bg-amber-500 text-white text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest">Última pieza</span>
                  ) : null}
                  {!product.published && (
                    <span className="bg-black/80 text-white text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest">Oculto</span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-stone-900 uppercase tracking-tighter text-sm">{product.name}</h3>
                  <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] shrink-0 ml-2">{product.collection}</span>
                </div>
                <p className="text-stone-500 text-xs mb-4">Stock: {product.stock}</p>
                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                  <span className="font-serif text-lg text-stone-800">${product.price.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => onOpenInventory(product)} className="p-2 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Ajustar Inventario">
                      <Box size={16} />
                    </button>
                    <button onClick={() => onEditProduct(product)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs text-stone-500">
            Mostrando <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>–<strong>{Math.min(currentPage * itemsPerPage, processedProducts.length)}</strong> de <strong>{processedProducts.length}</strong>
          </p>
          <div className="flex gap-2 items-center">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase px-4">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
