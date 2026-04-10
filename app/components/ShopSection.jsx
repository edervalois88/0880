'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ProductCard from './ProductCard';

const ShopSection = ({ products, translations, language, whatsappNumber, searchQuery = '' }) => {
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  
  const t = translations[language];

  // Disable scroll when modal is open
  useEffect(() => {
    if (quickViewProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setModalImageLoaded(false);
    }
  }, [quickViewProduct]);

  // Obtener colecciones únicas
  const collections = useMemo(() => {
    const uniqueCollections = [...new Set(products.map(p => p.collection))];
    return ['all', ...uniqueCollections];
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      // Solo mostrar productos publicados
      if (!product.published) return false;

      const inCollection = selectedCollection === 'all' || product.collection === selectedCollection;
      if (!inCollection) return false;

      if (!normalizedSearch) return true;

      const description = language === 'es' ? product.descEs : product.descEn;

      const haystack = [
        product.name,
        product.collection,
        product.color,
        product.design,
        description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [products, selectedCollection, searchQuery, language]);

  // Manejar compra
  const handlePurchase = (product) => {
    const whatsappMessage = language === 'es' 
      ? `Hola 0880, me interesa el modelo ${product.name} en color ${product.color} con diseño ${product.design} de la colección ${product.collection}.`
      : `Hello 0880, I'm interested in the ${product.name} model, ${product.color} color with ${product.design} design from the ${product.collection} collection.`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  const handleStripeCheckout = async (product) => {
    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Hubo un error al procesar el pago. Por favor intenta de nuevo.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <section id="catalog" className="py-32 px-6 md:px-12 max-w-[2000px] mx-auto bg-[#fafafa]">
      
      {/* Header Minimalista */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-24 relative"
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-brand-black/40 font-bold block mb-4">
          0880 Collection
        </span>
        <h2 className="text-4xl md:text-6xl font-serif text-brand-black tracking-tight mb-6">
          {t.catalog.label.split('·')[0]}
        </h2>
        <div className="h-px w-24 bg-brand-black/20 mx-auto"></div>
      </motion.div>

      {/* Filtros elegantes y dinámicos */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 max-w-4xl mx-auto">
          {collections.map((collection) => {
            const isActive = selectedCollection === collection;
            const displayName = collection === 'all' ? t.catalog.all : collection;
            
            return (
              <button
                key={collection}
                onClick={() => setSelectedCollection(collection)}
                className={`
                  relative px-6 py-4 text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden
                  ${isActive ? 'text-brand-black' : 'text-brand-black/40 hover:text-brand-black'}
                `}
              >
                <span className="relative z-10">{displayName}</span>
                {isActive && (
                  <motion.div
                    layoutId="filterIndicator"
                    className="absolute inset-0 bg-white border border-brand-black/10 rounded-none -z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Grid Iterativo y Limpio */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-20">
        <AnimatePresence>
          {filteredProducts.map((product, i) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <ProductCard 
                product={product}
                index={i}
                language={language}
                onQuickView={setQuickViewProduct}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="mt-16 text-center border border-brand-black/10 bg-white px-6 py-12 max-w-2xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand-black/50 mb-3">
            {language === 'es' ? 'Sin resultados' : 'No results'}
          </p>
          <p className="text-sm text-brand-black/70">
            {language === 'es'
              ? `No encontramos productos para "${searchQuery}".`
              : `We could not find products for "${searchQuery}".`}
          </p>
        </div>
      )}

      {/* Quick View Modal (Interactivo) */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-md cursor-pointer"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-[70vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/50 backdrop-blur-md flex items-center justify-center text-brand-black hover:bg-black hover:text-white transition-colors rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>

              {/* Image Side */}
              <div className="w-full md:w-1/2 relative bg-[#f0f0f0] h-1/2 md:h-full overflow-hidden group">
                {!modalImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand-black/20 border-t-brand-black animate-spin rounded-full"></div>
                  </div>
                )}
                <Image 
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  fill
                  onLoadingComplete={() => setModalImageLoaded(true)}
                  className={`object-cover object-center transition-opacity duration-700 ${modalImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>

              {/* Detail Side */}
              <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col h-1/2 md:h-full overflow-y-auto">
                <span className="text-[10px] uppercase tracking-[0.3em] text-brand-black/50 font-bold mb-4 block">
                  {quickViewProduct.collection} Collection
                </span>
                
                <h3 className="font-serif text-4xl md:text-5xl text-brand-black mb-6 leading-tight">
                  {quickViewProduct.name}
                </h3>
                
                <div className="text-2xl font-light text-brand-black tracking-widest mb-10 pb-10 border-b border-brand-black/10">
                  ${quickViewProduct.price.toLocaleString('es-MX')} <span className="text-xs">MXN</span>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-brand-black/40 block mb-2">Color</span>
                    <span className="font-medium text-sm tracking-widest uppercase">{quickViewProduct.color}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-brand-black/40 block mb-2">{language === 'es' ? 'Diseño' : 'Design'}</span>
                    <span className="font-medium text-sm tracking-widest uppercase">{quickViewProduct.design}</span>
                  </div>
                </div>

                <div className="mb-12">
                   <p className="text-xs leading-loose text-brand-black/60 tracking-wider font-light">
                     {language === 'es' ? quickViewProduct.descEs : quickViewProduct.descEn}
                   </p>
                </div>

                {quickViewProduct.stock <= 0 && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded flex items-center justify-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-red-600 font-bold">
                      {language === 'es' ? 'Producto Agotado' : 'Sold Out'}
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-8 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => handleStripeCheckout(quickViewProduct)}
                      disabled={isCheckoutLoading || quickViewProduct.stock <= 0}
                      className="flex-1 bg-black text-white px-8 py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-stone-800 transition-colors duration-300 flex items-center justify-center gap-4 group disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isCheckoutLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                      ) : (
                        <>
                          {language === 'es' ? 'Comprar Ahora' : 'Buy Now'}
                          <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handlePurchase(quickViewProduct)}
                      className="flex-1 bg-transparent border border-brand-black/20 text-brand-black px-8 py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-white transition-all duration-300 flex items-center justify-center gap-4 group"
                    >
                      {language === 'es' ? 'Asesoría WhatsApp' : 'WhatsApp Info'}
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-brand-black/40 uppercase tracking-widest">
                    {language === 'es' ? 'Pagos seguros con Stripe' : 'Secure payments with Stripe'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ShopSection;
