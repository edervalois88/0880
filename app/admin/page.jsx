'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Image as ImageIcon, Layout, Type, Palette, Save, Eye, Plus, Trash2, Home, CheckCircle, Edit2, X, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { productsData } from '../data/constants';
import Image from 'next/image';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState(productsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Simulated configuration state
  const [config, setConfig] = useState({
    siteName: '0880',
    whatsappNumber: '5215633551085',
    currency: 'MXN',
    hero: {
      title1: 'Arte en',
      title2: 'cada puntada.',
      subtitle: 'Lujo Silencioso • Hecho a Mano • León, Gto.',
    },
    theme: {
      primaryColor: '#b45309', // amber-700
      backgroundColor: '#fafafa',
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call to save directly to a config file/db
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Cambios guardados exitosamente. Visita el sitio para ver los resultados.');
    }, 1500);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct.id === 'new') {
      const newId = Math.max(...products.map(p => p.id)) + 1;
      setProducts([{ ...editingProduct, id: newId }, ...products]);
      toast.success('Producto agregado con éxito.');
    } else {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
      toast.success('Producto actualizado.');
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id) => {
    if(confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
      toast.success('Producto eliminado.');
    }
  };

  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'hero', label: 'Hero & Textos', icon: Type },
    { id: 'theme', label: 'Apariencia', icon: Palette },
    { id: 'catalog', label: 'Catálogo', icon: Layout },
    { id: 'media', label: 'Multimedia', icon: ImageIcon },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.collection.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex flex-col md:flex-row">
      <Toaster position="top-right" />
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-200 h-screen sticky top-0 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-stone-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-serif text-xs font-bold">
            0880
          </div>
          <span className="font-bold tracking-widest uppercase text-xs">Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-amber-50 text-amber-700' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-stone-100">
          <a href="/" target="_blank" className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs uppercase tracking-widest border border-stone-300 rounded hover:bg-stone-50 transition-colors">
            <Eye size={14} />
            Ver Sitio
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <h1 className="font-serif text-xl">Configuración del Sitio</h1>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded text-xs uppercase tracking-widest font-bold hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className={`${activeTab === 'catalog' ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>
            <AnimatePresence mode="popLayout">
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Settings size={18} className="text-amber-600" />
                      Información General
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Nombre del Sitio</label>
                        <input 
                          type="text" 
                          value={config.siteName}
                          onChange={(e) => setConfig({...config, siteName: e.target.value})}
                          className="w-full border border-stone-300 rounded px-4 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Número de WhatsApp (Ventas)</label>
                        <div className="flex mb-1">
                          <span className="bg-stone-100 border border-stone-300 border-r-0 rounded-l px-3 py-2 text-stone-500 flex items-center">
                            +
                          </span>
                          <input 
                            type="text" 
                            value={config.whatsappNumber}
                            onChange={(e) => setConfig({...config, whatsappNumber: e.target.value})}
                            className="w-full border border-stone-300 rounded-r px-4 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                            placeholder="52 1 555 123 4567"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400">Incluye el código de país. Ej: 5215633551085</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* HERO & TEXTOS TAB */}
              {activeTab === 'hero' && (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Type size={18} className="text-amber-600" />
                      Textos de Portada (Hero)
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Título Principal (Línea 1)</label>
                        <input 
                          type="text" 
                          value={config.hero.title1}
                          onChange={(e) => setConfig({...config, hero: {...config.hero, title1: e.target.value}})}
                          className="w-full border border-stone-300 rounded px-4 py-2 font-serif text-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Título Principal (Línea 2 - Itálica)</label>
                        <input 
                          type="text" 
                          value={config.hero.title2}
                          onChange={(e) => setConfig({...config, hero: {...config.hero, title2: e.target.value}})}
                          className="w-full border border-stone-300 rounded px-4 py-2 font-serif italic text-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Subtítulo (Microcopy)</label>
                        <input 
                          type="text" 
                          value={config.hero.subtitle}
                          onChange={(e) => setConfig({...config, hero: {...config.hero, subtitle: e.target.value}})}
                          className="w-full border border-stone-300 rounded px-4 py-2 text-xs uppercase tracking-widest focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CATALOG TAB */}
              {activeTab === 'catalog' && (
                <motion.div
                  key="catalog"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-800">Inventario y Catálogo</h2>
                      <p className="text-sm text-stone-500 mt-1">Gestiona tus colecciones, precios y detalles de {products.length} productos.</p>
                    </div>
                    <button 
                      onClick={() => setEditingProduct({ id: 'new', name: '', collection: 'Valentina', price: 4200, color: '', design: '', image: '/images/valentina.png', desc: { es: '', en: '' } })}
                      className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shrink-0"
                    >
                      <Plus size={16} />
                      Nuevo Producto
                    </button>
                  </div>

                  {/* Search and Filter */}
                  <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex items-center gap-3">
                    <Search className="text-stone-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre, color o colección..." 
                      className="flex-1 outline-none text-sm placeholder:text-stone-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                            <th className="p-4 font-semibold">Producto</th>
                            <th className="p-4 font-semibold">Colección</th>
                            <th className="p-4 font-semibold">Color / Diseño</th>
                            <th className="p-4 font-semibold">Precio (MXN)</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-16 bg-stone-100 rounded overflow-hidden relative border border-stone-200 shrink-0">
                                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                                  </div>
                                  <span className="font-serif text-base text-stone-800">{product.name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs tracking-wider">{product.collection}</span>
                              </td>
                              <td className="p-4">
                                <div className="text-sm text-stone-800">{product.color}</div>
                                <div className="text-xs text-stone-500">{product.design}</div>
                              </td>
                              <td className="p-4 font-medium text-stone-800">
                                ${product.price.toLocaleString()}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingProduct(product)} className="text-stone-400 hover:text-amber-700 p-2 transition-colors">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => handleDeleteProduct(product.id)} className="text-stone-400 hover:text-red-600 p-2 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {filteredProducts.length === 0 && (
                        <div className="p-12 text-center text-stone-500 flex flex-col items-center">
                          <Layout size={40} className="text-stone-300 mb-4" />
                          <p>No se encontraron productos en tu búsqueda.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* THEME TAB */}
              {activeTab === 'theme' && (
                <motion.div
                  key="theme"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Palette size={18} className="text-amber-600" />
                      Apariencia y Colores
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">Color Brand Principal</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="color" 
                            value={config.theme.primaryColor}
                            onChange={(e) => setConfig({...config, theme: {...config.theme, primaryColor: e.target.value}})}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0 shadow-sm"
                          />
                          <input 
                            type="text" 
                            value={config.theme.primaryColor}
                            onChange={(e) => setConfig({...config, theme: {...config.theme, primaryColor: e.target.value}})}
                            className="border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 font-mono text-stone-600"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">Este color dicta los acentos, botones primarios e interacciones flotantes.</p>
                      </div>
                      
                      <div className="pt-6 border-t border-stone-100">
                        <label className="block text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wide">Color de Fondo Principal</label>
                        <div className="flex gap-4">
                           {['#fafafa', '#ffffff', '#f5f5f4', '#fdfbf7'].map(color => (
                             <button
                               key={color}
                               onClick={() => setConfig({...config, theme: {...config.theme, backgroundColor: color}})}
                               className={`w-12 h-12 rounded-full border-2 transition-all ${config.theme.backgroundColor === color ? 'border-amber-600 scale-110 shadow-md ring-2 ring-amber-600/20 ring-offset-2' : 'border-stone-200 hover:scale-105'}`}
                               style={{ backgroundColor: color }}
                             />
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MEDIA TAB */}
              {activeTab === 'media' && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={18} className="text-amber-600" />
                        Galería Multimedia Global
                      </h2>
                      <button className="text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors">
                        <Plus size={14} /> Subir Imagen
                      </button>
                    </div>

                    <p className="text-sm text-stone-500 mb-8 font-light">
                      Gestiona las imágenes maestras que se usan en la página principal, orígenes, banners decorativos u otras vistas no ligadas al inventario.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {[
                        { id: 1, src: '/images/Gemini_Generated_Image_de5chode5chode5c.png', tag: 'Hero Cover' },
                        { id: 2, src: '/images/valentina.png', tag: 'Textura' },
                        { id: 3, src: '/images/extracted/page_2_img_0.jpeg', tag: 'Detalle Piel' },
                        { id: 4, src: '/images/extracted/page_9_img_0.jpeg', tag: 'Banner Amor' },
                      ].map(img => (
                        <div key={img.id} className="group relative aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                          <Image src={img.src} alt={img.tag} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <span className="text-white text-xs font-bold tracking-widest uppercase mb-3">{img.tag}</span>
                            <div className="flex gap-2">
                              <button className="flex-1 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded py-1.5 text-white transition-colors flex justify-center">
                                <Edit2 size={14} />
                              </button>
                              <button className="flex-1 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded py-1.5 text-white transition-colors flex justify-center">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Modal for Editing/Adding Product */}
        <AnimatePresence>
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
                onClick={() => setEditingProduct(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center shrink-0">
                  <h3 className="font-serif text-2xl">{editingProduct.id === 'new' ? 'Agregar Producto' : 'Editar Producto'}</h3>
                  <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-800 transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  <form id="productForm" onSubmit={handleSaveProduct} className="space-y-6">
                    <div className="flex gap-6 items-start">
                      <div className="w-1/3 space-y-2">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">Imagen</label>
                        <div className="aspect-[3/4] bg-stone-100 rounded-lg border border-stone-200 border-dashed flex items-center justify-center relative overflow-hidden group hover:bg-stone-50 transition-colors cursor-pointer">
                          <Image src={editingProduct.image || '/images/valentina.png'} alt="Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ImageIcon size={24} />
                          </div>
                        </div>
                        <input 
                          type="text" 
                          placeholder="URL / Ruta de la imagen" 
                          value={editingProduct.image}
                          onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                          className="w-full text-[10px] p-2 border border-stone-200 rounded outline-none focus:border-amber-500 mt-2"
                        />
                      </div>
                      
                      <div className="w-2/3 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Nombre</label>
                            <input 
                              type="text" required
                              value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Colección</label>
                            <select 
                              value={editingProduct.collection} onChange={(e) => setEditingProduct({...editingProduct, collection: e.target.value})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                            >
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
                            <input 
                              type="text" required
                              value={editingProduct.color} onChange={(e) => setEditingProduct({...editingProduct, color: e.target.value})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Precio ($ MXN)</label>
                            <input 
                              type="number" required min="0" step="100"
                              value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseInt(e.target.value)})}
                              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Diseño (Bordado / Variante)</label>
                          <input 
                            type="text" required
                            value={editingProduct.design} onChange={(e) => setEditingProduct({...editingProduct, design: e.target.value})}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wide">Descripción Detallada</label>
                          <textarea 
                            rows="3" required
                            value={editingProduct.desc?.es || ''} onChange={(e) => setEditingProduct({...editingProduct, desc: { ...editingProduct.desc, es: e.target.value }})}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 shrink-0">
                  <button onClick={() => setEditingProduct(null)} type="button" className="px-5 py-2 rounded text-stone-600 font-medium hover:bg-stone-200 transition-colors text-sm">
                    Cancelar
                  </button>
                  <button form="productForm" type="submit" className="px-5 py-2 rounded bg-black text-white font-medium hover:bg-stone-800 transition-colors text-sm flex items-center gap-2">
                    <Save size={16} />
                    Guardar Producto
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
