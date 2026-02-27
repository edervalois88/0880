'use client'

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const ProductCard = ({ product, index, whatsappNumber, btnText, language }) => {
  const whatsappMessage = language === 'es' 
    ? `Hola 0880, me interesa el modelo ${product.name} en color ${product.color} con diseño ${product.design}.`
    : `Hello 0880, I'm interested in the ${product.name} model in ${product.color} with ${product.design} design.`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6 }}
      className="group cursor-pointer"
    >
      {/* Imagen del producto */}
      <div className="relative overflow-hidden aspect-[3/4] bg-gradient-to-br from-amber-50 to-stone-100 mb-4 border border-stone-200/50">
        <Image 
          src={product.image} 
          alt={`${product.name} - ${product.color}`}
          fill
          className="object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
        />
        
        {/* Badge de colección */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 text-[9px] font-medium uppercase tracking-[0.2em]">
          {product.collection}
        </div>

        {/* Overlay con botón de consulta */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-center p-6 transition-all duration-300"
        >
          <a 
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noreferrer" 
            className="bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-amber-500 hover:text-white transition-all duration-300 border-2 border-white hover:border-amber-500"
          >
            {btnText}
          </a>
        </motion.div>
      </div>
      
      {/* Información del producto */}
      <div className="space-y-2 px-1">
        {/* Nombre y diseño */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif text-lg text-brand-black tracking-wide flex-1">
            {product.name}
          </h3>
          <div className="text-right">
            <div className="text-sm font-bold tracking-wider text-amber-700">
              ${product.price.toLocaleString('es-MX')}
            </div>
            <div className="text-[8px] text-brand-black/40 uppercase tracking-wider">MXN</div>
          </div>
        </div>

        {/* Color y diseño */}
        <div className="flex gap-2 text-[9px] uppercase tracking-[0.15em] text-brand-black/60">
          <span className="bg-stone-100 px-2 py-1 border border-stone-200">{product.color}</span>
          <span className="bg-amber-50 px-2 py-1 border border-amber-200/50">{product.design}</span>
        </div>

        {/* Features */}
        <div className="pt-2 border-t border-stone-200/50">
          <p className="text-[9px] text-brand-black/50 leading-relaxed tracking-wide">
            {product.desc[language]}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
