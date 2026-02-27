'use client'

import React from 'react';
import { motion } from 'framer-motion';

export default function BrandLogo({ size = 100, color = "#191919", className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <motion.svg 
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100"
      >
        <defs>
          <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
        </defs>
        <text fill={color} fontSize="8.5" letterSpacing="2.5" fontWeight="bold" fontFamily="serif">
          <textPath xlinkHref="#circlePath" startOffset="0%">
            C E R O  O C H O  O C H E N T A  C E R O  O C H O  O C H E N T A
          </textPath>
        </text>
      </motion.svg>
      <span className="font-serif font-bold tracking-widest z-10" style={{ color, fontSize: size * 0.25 }}>0880</span>
    </div>
  );
}
