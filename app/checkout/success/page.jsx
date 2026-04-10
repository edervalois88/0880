'use client'

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function SuccessPage() {
  useEffect(() => {
    // Lanzar confeti al cargar
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans text-stone-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-stone-100"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={40} />
        </motion.div>

        <h1 className="font-serif text-3xl mb-2">¡Gracias por tu compra!</h1>
        <p className="text-stone-500 mb-8 text-sm font-light">
          Tu pedido ha sido procesado exitosamente. Recibirás un correo de confirmación con los detalles de tu envío en breve.
        </p>

        <div className="space-y-3">
          <Link 
            href="/#catalog" 
            className="flex items-center justify-center gap-2 w-full bg-black text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-stone-800 transition-all hover:scale-[1.02]"
          >
            Seguir comprando
            <ShoppingBag size={16} />
          </Link>
          
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full bg-transparent text-stone-500 px-6 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-stone-100 transition-all"
          >
            Volver al inicio
            <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="mt-12 pt-6 border-t border-stone-100 flex items-center justify-center gap-2 opacity-50">
          <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-serif text-[10px] font-bold">
            0880
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold">Luxury Collection</span>
        </div>
      </motion.div>
    </div>
  );
}
