'use client'

import { Settings, Type, Palette, Image as ImageIcon, Plus, Edit2, Trash2 } from 'lucide-react'
import Image from 'next/image'

export default function SettingsTab({ activeTab, config, setConfig }) {
  if (activeTab === 'general') {
    return (
      <div className="space-y-8">
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
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="w-full border border-stone-300 rounded px-4 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Número de WhatsApp (Ventas)</label>
              <div className="flex mb-1">
                <span className="bg-stone-100 border border-stone-300 border-r-0 rounded-l px-3 py-2 text-stone-500 flex items-center">+</span>
                <input
                  type="text"
                  value={config.whatsappNumber}
                  onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                  className="w-full border border-stone-300 rounded-r px-4 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  placeholder="52 1 555 123 4567"
                />
              </div>
              <p className="text-[10px] text-stone-400">Incluye el código de país. Ej: 5215633551085</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'hero') {
    return (
      <div className="space-y-8">
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
                value={config.heroTitle1}
                onChange={(e) => setConfig({ ...config, heroTitle1: e.target.value })}
                className="w-full border border-stone-300 rounded px-4 py-2 font-serif text-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Título Principal (Línea 2 - Itálica)</label>
              <input
                type="text"
                value={config.heroTitle2}
                onChange={(e) => setConfig({ ...config, heroTitle2: e.target.value })}
                className="w-full border border-stone-300 rounded px-4 py-2 font-serif italic text-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Subtítulo (Microcopy)</label>
              <input
                type="text"
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                className="w-full border border-stone-300 rounded px-4 py-2 text-xs uppercase tracking-widest focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'theme') {
    return (
      <div className="space-y-8">
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
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0 shadow-sm"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 font-mono text-stone-600"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-2">Dicta acentos, botones primarios e interacciones.</p>
            </div>
            <div className="pt-6 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wide">Color de Fondo Principal</label>
              <div className="flex gap-4">
                {['#fafafa', '#ffffff', '#f5f5f4', '#fdfbf7'].map(color => (
                  <button
                    key={color}
                    onClick={() => setConfig({ ...config, backgroundColor: color })}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${config.backgroundColor === color ? 'border-amber-600 scale-110 shadow-md ring-2 ring-amber-600/20 ring-offset-2' : 'border-stone-200 hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'media') {
    return (
      <div className="space-y-8">
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
          <p className="text-sm text-stone-500 mb-8 font-light">Gestiona las imágenes maestras de la página principal, banners y vistas no ligadas al inventario.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { id: 1, src: '/images/Gemini_Generated_Image_de5chode5chode5c.png', tag: 'Hero Cover' },
              { id: 2, src: '/images/extracted/page_1_img_1.png', tag: 'Textura' },
              { id: 3, src: '/images/extracted/page_2_img_1.jpeg', tag: 'Detalle Piel' },
              { id: 4, src: '/images/extracted/page_9_img_1.jpeg', tag: 'Banner Amor' },
            ].map(img => (
              <div key={img.id} className="group relative aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                <Image src={img.src} alt={img.tag} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-white text-xs font-bold tracking-widest uppercase mb-3">{img.tag}</span>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded py-1.5 text-white flex justify-center"><Edit2 size={14} /></button>
                    <button className="flex-1 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded py-1.5 text-white flex justify-center"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
