'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Image as ImageIcon, Layout, Type, Palette, Save, Eye, Plus, Trash2, Home, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
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

  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'hero', label: 'Hero & Textos', icon: Type },
    { id: 'theme', label: 'Apariencia', icon: Palette },
    { id: 'catalog', label: 'Catálogo', icon: Layout },
    { id: 'media', label: 'Multimedia', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex flex-col md:flex-row">
      <Toaster position="top-right" />
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-stone-200 h-screen sticky top-0 flex flex-col hidden md:flex">
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6 shrink-0">
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
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
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

              {/* PLACEHOLDERS PARA OTRAS TABS */}
              {(activeTab === 'theme' || activeTab === 'catalog' || activeTab === 'media') && (
                <motion.div
                  key="coming-soon"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center p-12 text-center h-64 bg-stone-50 border border-stone-200 border-dashed rounded-lg"
                >
                  <Layout size={48} className="text-stone-300 mb-4" />
                  <h3 className="font-serif text-xl text-stone-700 mb-2">Módulo en Construcción</h3>
                  <p className="text-sm text-stone-500 max-w-sm">
                    Esta sección del CMS formará parte de la próxima actualización de integración para bases de datos (MongoDB/PostgreSQL).
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
