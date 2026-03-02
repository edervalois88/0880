'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ProductCard = ({ product, index, language, onQuickView }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#f8f8f8] mb-6">
        <motion.div
           animate={{ scale: isHovered ? 1.05 : 1 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
           className="w-full h-full relative"
        >
          <Image 
            src={product.image} 
            alt={`${product.name} - ${product.color}`}
            fill
            className="object-cover object-center" 
          />
        </motion.div>
        
        {/* Subtle Collection Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-white/80 backdrop-blur-md text-brand-black px-3 py-1 text-[8px] font-medium uppercase tracking-[0.25em]">
            {product.collection}
          </span>
        </div>

        {/* Hover Action Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/10 flex items-end justify-center pb-8"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(product);
                }}
                className="bg-white/90 backdrop-blur-sm text-brand-black px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-brand-black hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-2xl"
              >
                {language === 'es' ? 'Vista Rápida' : 'Quick View'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Product Details - Minimalist */}
      <div className="flex flex-col flex-grow items-center text-center px-4">
        <h3 className="font-serif text-lg text-brand-black mb-2 transition-colors duration-300 group-hover:text-amber-700">
          {product.name}
        </h3>
        
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-black/50 mb-3">
          {product.color} <span className="mx-1">·</span> {product.design}
        </p>
        
        <div className="mt-auto">
          <span className="text-sm tracking-widest font-light text-brand-black">
            ${product.price.toLocaleString('es-MX')} <span className="text-[9px] uppercase tracking-widest text-brand-black/40">MXN</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
