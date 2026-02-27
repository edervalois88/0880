'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';

const MobileMenu = ({ isOpen, onClose, t, language, toggleLanguage }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Menu Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-white z-50 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-brand-black/10">
                <BrandLogo size={50} />
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-brand-grey/20 rounded-full transition-colors"
                  aria-label="Cerrar menú"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto py-8 px-6">
                <ul className="space-y-2">
                  <motion.li
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <a
                      href="#hero"
                      onClick={onClose}
                      className="block py-4 px-4 text-base uppercase tracking-[0.2em] font-medium text-brand-black hover:bg-brand-grey/10 hover:translate-x-2 transition-all rounded-sm"
                    >
                      {t.nav.home}
                    </a>
                  </motion.li>
                  
                  <motion.li
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <a
                      href="#catalog"
                      onClick={onClose}
                      className="block py-4 px-4 text-base uppercase tracking-[0.2em] font-medium text-brand-black hover:bg-brand-grey/10 hover:translate-x-2 transition-all rounded-sm"
                    >
                      {t.nav.collection}
                    </a>
                  </motion.li>
                  
                  <motion.li
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <a
                      href="#origin"
                      onClick={onClose}
                      className="block py-4 px-4 text-base uppercase tracking-[0.2em] font-medium text-brand-black hover:bg-brand-grey/10 hover:translate-x-2 transition-all rounded-sm"
                    >
                      {t.nav.philosophy}
                    </a>
                  </motion.li>
                  
                  <motion.li
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="pt-4"
                  >
                    <a
                      href="#catalog"
                      onClick={onClose}
                      className="block py-4 px-4 text-base uppercase tracking-[0.2em] font-bold text-white bg-brand-black hover:bg-brand-grey hover:text-brand-black transition-all rounded-sm text-center"
                    >
                      {t.nav.shop}
                    </a>
                  </motion.li>
                </ul>
              </nav>

              {/* Footer with Language Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border-t border-brand-black/10 p-6 bg-brand-grey/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-brand-black/60 font-medium">
                    Idioma / Language
                  </span>
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold bg-white border-2 border-brand-black/20 px-4 py-2 hover:border-brand-black hover:bg-brand-black hover:text-white transition-all rounded-sm"
                  >
                    <span className={language === 'es' ? 'text-current' : 'opacity-40'}>ES</span>
                    <span className="opacity-30">|</span>
                    <span className={language === 'en' ? 'text-current' : 'opacity-40'}>EN</span>
                  </button>
                </div>

                {/* Social Links */}
                <div className="mt-6 pt-6 border-t border-brand-black/10">
                  <p className="text-[9px] uppercase tracking-wider text-brand-black/40 mb-3">
                    Síguenos
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="https://www.instagram.com/0880mx"
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 bg-brand-black text-white rounded-full flex items-center justify-center hover:bg-brand-grey hover:text-brand-black transition-colors"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a
                      href="https://www.facebook.com/CeroOchoOchentaMX"
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 bg-brand-black text-white rounded-full flex items-center justify-center hover:bg-brand-grey hover:text-brand-black transition-colors"
                      aria-label="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.641c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
