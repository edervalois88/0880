'use client'

import React from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

export default function Loader({ onComplete }) {
  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#191919]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.5 } }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="relative"
      >
        <BrandLogo size={150} color="#FFFFFF" />
        
        {/* Progress Line */}
        <motion.div 
          className="absolute -bottom-8 left-0 h-[1px] bg-white origin-left"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          onAnimationComplete={onComplete}
        />
      </motion.div>

      {/* Split Screen Exit Animation */}
      <motion.div 
        className="absolute inset-0 bg-[#191919] z-[-1]"
        exit={{ 
          clipPath: "inset(0 0 0 0)",
          transition: { duration: 0.1 }
        }}
      />
    </motion.div>
  );
}
