'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import BrandLogo from './components/BrandLogo';
import Loader from './components/Loader';
import ShopSection from './components/ShopSection';
import { productsData, translations, fadeUp, staggerChildren, whatsappNumber } from './data/constants';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [language, setLanguage] = useState('es');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerData = [
    {
      image: "/images/banner-clean.png",
      textKey: "slide1",
      showLogo: false,
      overlayClass: "bg-black/20"
    },
    {
      image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=2500&auto=format&fit=crop",
      textKey: "slide2",
      showLogo: true,
      overlayClass: "bg-black/60"
    }
  ];

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);
  const moodScale = useTransform(scrollY, [1000, 2000], [1, 1.1]);

  const t = translations[language];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerData.length]);

  const products = productsData.map(p => ({
    ...p,
    desc: p.desc[language]
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  return (
    <div className="bg-brand-white font-sans text-brand-black selection:bg-brand-black selection:text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {loading ? (
          <Loader key="loader" onComplete={() => setLoading(false)} />
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1 }}
          >
          
          {/* Navbar */}
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`navbar fixed top-0 z-40 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm h-20' : 'bg-transparent h-24'}`}
          >
            <div className="navbar-start pl-4 md:pl-8">
              <a href="#" className="hidden lg:block hover:opacity-80 transition-opacity">
                <BrandLogo size={60} />
              </a>
              <a href="#" className="lg:hidden font-serif text-2xl font-bold tracking-widest">0880</a>
            </div>
            
            <div className="navbar-center hidden lg:flex">
              <ul className="flex gap-16 text-xs uppercase tracking-[0.2em] font-medium text-brand-black/80">
                <motion.li whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#hero" className="hover:text-brand-black relative group py-2 block">
                    {t.nav.home}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-black transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </motion.li>
                <motion.li whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#catalog" className="hover:text-brand-black relative group py-2 block">
                    {t.nav.collection}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-black transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </motion.li>
                <motion.li whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                  <a href="#origin" className="hover:text-brand-black relative group py-2 block">
                    {t.nav.philosophy}
                    <span className="absolute bottom-0 left-0 w-0 h-px bg-brand-black transition-all duration-300 group-hover:w-full"></span>
                  </a>
                </motion.li>
              </ul>
            </div>
            
            <div className="navbar-end pr-4 md:pr-8 flex gap-6 items-center">
              <button 
                onClick={toggleLanguage}
                className="text-[10px] uppercase tracking-widest font-bold hover:text-brand-grey transition-colors"
                aria-label="Toggle Language"
              >
                <span className={language === 'es' ? 'text-black' : 'text-gray-400'}>ES</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className={language === 'en' ? 'text-black' : 'text-gray-400'}>EN</span>
              </button>

              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#catalog" 
                className="btn btn-outline btn-sm rounded-none border-brand-black text-brand-black hover:bg-brand-black hover:text-white uppercase tracking-widest text-[10px] px-8 py-2 h-auto min-h-0 font-medium transition-colors hidden md:flex"
              >
                {t.nav.shop}
              </motion.a>
            </div>
          </motion.div>

          {/* Hero Section */}
          <div id="hero" className="hero min-h-screen relative overflow-hidden flex items-center justify-center">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-black/50 z-10"></div>
              <Image 
                src="/images/Gemini_Generated_Image_fzyqpqfzyqpqfzyq.png" 
                alt="Editorial Girl" 
                fill
                className="object-cover object-center"
                priority
              />
            </motion.div>
            
            <div className="relative z-10 text-center text-white w-full max-w-5xl px-4 mt-20">
              <motion.div
                 initial="hidden"
                 animate="visible"
                 variants={staggerChildren}
              >
                <div className="overflow-hidden mb-4">
                  <motion.h1 variants={fadeUp} className="text-6xl md:text-9xl font-serif tracking-tighter leading-[0.85] drop-shadow-2xl mix-blend-overlay opacity-90">
                    {t.hero.title1}
                  </motion.h1>
                </div>
                <div className="overflow-hidden mb-12">
                   <motion.h1 variants={fadeUp} className="text-6xl md:text-9xl font-serif italic font-light tracking-tighter leading-[0.85] drop-shadow-2xl">
                    {t.hero.title2}
                  </motion.h1>
                </div>
                
                <motion.p variants={fadeUp} className="text-sm md:text-lg font-light tracking-[0.3em] uppercase max-w-lg mx-auto text-brand-grey mb-16 border-t border-white/20 pt-8">
                  {t.hero.subtitle}
                </motion.p>
                
                <motion.div variants={fadeUp}>
                  <a href="#catalog" className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-medium tracking-widest text-white transition duration-300 ease-out border border-white rounded-none hover:text-black hover:bg-white">
                    <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-brand-black group-hover:translate-x-0 ease">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                    <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease uppercase text-xs">{t.hero.cta}</span>
                    <span className="relative invisible uppercase text-xs">{t.hero.cta}</span>
                  </a>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Origin Section */}
          <section id="origin" className="py-32 px-6 md:px-12 bg-white relative overflow-hidden">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerChildren}
              className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center"
            >
              <div className="order-2 md:order-1 space-y-10">
                 <motion.span variants={fadeUp} className="text-xs font-bold tracking-[0.3em] uppercase text-brand-grey block">{t.origin.label}</motion.span>
                 <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-serif text-brand-black leading-tight">
                   &ldquo;{t.origin.title1} <br/> <span className="italic text-brand-grey font-light">{t.origin.title2}&rdquo;</span>
                 </motion.h2>
                 <motion.div variants={fadeUp} className="w-24 h-px bg-brand-black/20"></motion.div>
                 <motion.p variants={fadeUp} className="text-lg font-light leading-loose text-brand-black/70 tracking-wide text-justify">
                   {t.origin.desc}
                 </motion.p>
              </div>
              
              <motion.div variants={fadeUp} className="order-1 md:order-2 flex justify-center relative items-center">
                 <motion.div 
                    whileHover={{ scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full max-w-sm aspect-[3/4]"
                 >
                    <Image 
                      src="/images/Gemini_Generated_Image_de5chode5chode5c.png" 
                      alt="Craftsmanship" 
                      fill
                      className="object-cover shadow-2xl grayscale brightness-110 contrast-100" 
                    />
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -bottom-6 -left-6 bg-brand-black p-4 w-32 shadow-xl text-white z-10"
                    >
                      <p className="font-serif italic text-lg text-center">100%</p>
                      <p className="text-[8px] uppercase tracking-widest opacity-70 text-center">{t.origin.badge}</p>
                    </motion.div>
                 </motion.div>
              </motion.div>
            </motion.div>
          </section>

          {/* Savoir-Faire Section */}
          <section className="py-24 px-6 bg-brand-grey/5 border-y border-brand-black/5">
             <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-brand-black/10">
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                     className="px-4 py-8"
                   >
                      <div className="h-px w-12 bg-brand-black mx-auto mb-6"></div>
                      <h3 className="font-serif text-2xl mb-4 italic">{t.savoir.t1}</h3>
                      <p className="text-xs uppercase tracking-[0.2em] leading-relaxed opacity-70">
                         {t.savoir.d1}
                      </p>
                   </motion.div>
                   
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.4 }}
                     className="px-4 py-8"
                   >
                      <div className="h-px w-12 bg-brand-black mx-auto mb-6"></div>
                      <h3 className="font-serif text-2xl mb-4 italic">{t.savoir.t2}</h3>
                      <p className="text-xs uppercase tracking-[0.2em] leading-relaxed opacity-70">
                         {t.savoir.d2}
                      </p>
                   </motion.div>
                   
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.6 }}
                     className="px-4 py-8"
                   >
                      <div className="h-px w-12 bg-brand-black mx-auto mb-6"></div>
                      <h3 className="font-serif text-2xl mb-4 italic">{t.savoir.t3}</h3>
                      <p className="text-xs uppercase tracking-[0.2em] leading-relaxed opacity-70">
                         {t.savoir.d3}
                      </p>
                   </motion.div>
                </div>
             </div>
          </section>

          {/* Details Banner Section */}
          <section className="w-full h-[60vh] md:h-[85vh] relative bg-[#191919] overflow-hidden flex items-center justify-center">
             <motion.div 
                style={{ scale: moodScale }}
                className="absolute inset-0"
             >
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentBannerIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                     <Image 
                      src={bannerData[currentBannerIndex].image}
                      alt="Mood Texture" 
                      fill
                      className="object-cover object-center"
                    />
                  </motion.div>
                </AnimatePresence>
                
                <div className={`absolute inset-0 mix-blend-multiply transition-all duration-1000 ${bannerData[currentBannerIndex].overlayClass}`}></div>
             </motion.div>

             <AnimatePresence mode="wait">
               <motion.div 
                  key={currentBannerIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="relative z-10 text-center mix-blend-difference px-4"
               >
                 {bannerData[currentBannerIndex].showLogo && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1 }}
                      className="mb-6 flex justify-center"
                    >
                       <BrandLogo size={100} color="#FFFFFF" />
                    </motion.div>
                 )}
                 <h2 className="text-5xl md:text-8xl font-serif text-white/90 italic drop-shadow-lg leading-tight">
                   {t.banner[bannerData[currentBannerIndex].textKey].title} <br/>
                   <span className="font-sans font-light text-2xl md:text-4xl tracking-[0.3em] uppercase not-italic block mt-4">
                     {t.banner[bannerData[currentBannerIndex].textKey].subtitle}
                   </span>
                 </h2>
               </motion.div>
             </AnimatePresence>
          </section>

          {/* Catalog Grid */}
          <ShopSection 
            products={products}
            translations={translations}
            language={language}
            whatsappNumber={whatsappNumber}
          />

          {/* Footer */}
          <footer className="bg-[#111] text-brand-grey py-32 px-8 border-t border-white/5 relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 relative z-10">
              <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="space-y-8"
              >
                <BrandLogo size={80} color="#555" />
                <p className="text-sm font-light leading-relaxed tracking-wide opacity-60 pl-2 max-w-xs">
                  {t.footer.text}
                </p>
              </motion.div>
              
              <div className="flex gap-24 text-[10px] uppercase tracking-[0.25em] pt-4">
                <div className="flex flex-col gap-6">
                  <span className="font-bold text-white mb-2 opacity-30">{t.footer.explore}</span>
                  <a href="#hero" className="hover:text-white transition-colors hover:translate-x-2 duration-300 inline-block">{t.nav.home}</a>
                  <a href="#catalog" className="hover:text-white transition-colors hover:translate-x-2 duration-300 inline-block">{t.nav.collection}</a>
                  <a href="#origin" className="hover:text-white transition-colors hover:translate-x-2 duration-300 inline-block">{t.nav.philosophy}</a>
                </div>
                
                <div className="flex flex-col gap-6">
                  <span className="font-bold text-white mb-2 opacity-30">{t.footer.social}</span>
                  <div className="flex gap-4">
                    <motion.a 
                      href="https://www.instagram.com/0880mx"
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-brand-grey transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </motion.a>

                    <motion.a 
                      href="https://www.facebook.com/CeroOchoOchentaMX"
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.2, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-brand-grey transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.641c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z"/>
                      </svg>
                    </motion.a>

                    <motion.a 
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-brand-grey transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </motion.a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-24 -right-24 opacity-[0.02] select-none pointer-events-none origin-bottom-right animate-spin-slow">
               <BrandLogo size={800} color="#FFFFFF" />
            </div>
          </footer>

          {/* Floating WhatsApp Button */}
          <motion.a 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola, me gustaría recibir asesoría personalizada.")}`}
            target="_blank" 
            rel="noreferrer"
            className="fixed bottom-8 right-8 z-50 bg-black text-white rounded-full p-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:bg-brand-grey hover:text-black transition-colors duration-300 group"
          >
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </motion.a>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
