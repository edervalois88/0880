'use client'

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const ShopSection = ({ products, translations, language, whatsappNumber }) => {
  const [selectedCollection, setSelectedCollection] = useState('all');
  
  const t = translations[language];

  // Obtener colecciones únicas
  const collections = useMemo(() => {
    const uniqueCollections = [...new Set(products.map(p => p.collection))];
    return ['all', ...uniqueCollections];
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (selectedCollection === 'all') return products;
    return products.filter(p => p.collection === selectedCollection);
  }, [products, selectedCollection]);

  // Obtener precio por colección
  const getCollectionPrice = (collection) => {
    const product = products.find(p => p.collection === collection);
    return product ? `$${product.price.toLocaleString('es-MX')}` : '';
  };

  return (
    <section id="catalog" className="py-24 px-4 md:px-8 max-w-[1800px] mx-auto bg-gradient-to-b from-white via-amber-50/20 to-white">
      {/* Header con identidad mexicana */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16 relative"
      >
        {/* Decoración superior */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600/50"></div>
          <svg className="w-6 h-6 text-amber-700/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.5 8.5L22 9.5L17 14.5L18 21L12 17.5L6 21L7 14.5L2 9.5L8.5 8.5L12 2Z"/>
          </svg>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600/50"></div>
        </div>

        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-brand-black mb-3">
          {t.catalog.label}
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-brand-black/40 font-light">
          León, Guanajuato · México
        </p>
      </motion.div>

      {/* Filtros de colección */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 max-w-5xl mx-auto"
      >
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-brand-black/60 mb-6">
          {t.catalog.filter}
        </p>
        
        <div className="flex flex-wrap justify-center gap-3">
          {collections.map((collection) => {
            const isActive = selectedCollection === collection;
            const displayName = collection === 'all' ? t.catalog.all : collection;
            const price = collection !== 'all' ? getCollectionPrice(collection) : '';
            
            return (
              <motion.button
                key={collection}
                onClick={() => setSelectedCollection(collection)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] 
                  transition-all duration-300 border-2
                  ${isActive 
                    ? 'bg-amber-700 text-white border-amber-700 shadow-lg shadow-amber-700/30' 
                    : 'bg-white text-brand-black border-stone-200 hover:border-amber-600 hover:text-amber-700'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{displayName}</span>
                  {price && (
                    <span className={`text-[8px] font-normal tracking-wider ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                      {price} MXN
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Contador de productos */}
        <div className="text-center mt-8">
          <p className="text-[9px] uppercase tracking-[0.2em] text-brand-black/40">
            {t.catalog.showing} <strong className="text-amber-700 font-bold">{filteredProducts.length}</strong> {t.catalog.products}
          </p>
        </div>
      </motion.div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
        {filteredProducts.map((product, i) => (
          <ProductCard 
            key={product.id}
            product={product}
            index={i}
            whatsappNumber={whatsappNumber}
            btnText={t.catalog.btn}
            language={language}
          />
        ))}
      </div>

      {/* Mensaje de identidad mexicana */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 text-center max-w-2xl mx-auto"
      >
        <div className="border-t border-b border-amber-600/20 py-8 px-6">
          <p className="text-sm font-serif italic text-brand-black/70 leading-relaxed mb-4">
            &ldquo;Cada bolsa es hecha con mucho corazón por artesanos y peleteros en León, Guanajuato&rdquo;
          </p>
          <div className="flex items-center justify-center gap-4 text-[9px] uppercase tracking-[0.25em] text-brand-black/50">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              100% Piel Mexicana
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>
              </svg>
              Hecho a Mano
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ShopSection;
