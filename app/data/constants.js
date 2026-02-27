export const productsData = [
  {
    id: 1,
    name: "Valentina",
    price: 4500,
    image: "/images/valentina.png",
    desc: {
      es: "Elegancia atemporal con estructura definida y piel de grano superior.",
      en: "Timeless elegance with defined structure and top-grain leather."
    }
  },
  {
    id: 2,
    name: "Love",
    price: 3800,
    image: "/images/love.png",
    desc: {
      es: "Diseño romántico y compacto, ideal para ocasiones especiales.",
      en: "Romantic and compact design, ideal for special occasions."
    }
  },
  {
    id: 3,
    name: "Amelia",
    price: 5200,
    image: "/images/amelia.png",
    desc: {
      es: "Capacidad versátil con un toque bohemio de lujo.",
      en: "Versatile capacity with a bohemian touch of luxury."
    }
  },
  {
    id: 4,
    name: "Inés",
    price: 4100,
    image: "/images/ines.png",
    desc: {
      es: "Minimalismo sofisticado para la mujer moderna.",
      en: "Sophisticated minimalism for the modern woman."
    }
  }
];

export const translations = {
  es: {
    nav: { home: "Inicio", collection: "Colección", philosophy: "Filosofía", shop: "Shop" },
    hero: { 
      title1: "Arte en", 
      title2: "cada puntada.", 
      subtitle: "Lujo Silencioso • Hecho a Mano • México", 
      cta: "Explorar Colección" 
    },
    origin: {
      label: "Nuestro Manifiesto",
      title1: "No diseñamos accesorios,",
      title2: "esculpimos personalidad.",
      desc: "Cada pieza de 0880 nace de la intersección entre el arte crudo y la elegancia funcional. Inspirados en la dualidad de la fuerza y la delicadeza, utilizamos pieles seleccionadas a mano.",
      badge: "Hecho a mano"
    },
    savoir: {
      t1: "Piel Genuina", d1: "Selección premium de curtidurías certificadas en León.",
      t2: "Herrajes", d2: "Aleaciones de alta resistencia con baño de oro de 14k.",
      t3: "Edición Limitada", d3: "Producción en lotes pequeños para garantizar exclusividad."
    },
    banner: {
      slide1: { title: "Piel suave,", subtitle: "Detalles sublimes" },
      slide2: { title: "Elige tu esencia", subtitle: "" } 
    },
    catalog: {
      label: "La Colección · 2026",
      btn: "Ver Detalle"
    },
    footer: {
      text: "Bolsas artesanales que trascienden la moda para convertirse en legado. Diseñado en CDMX.",
      explore: "Explorar",
      social: "Social"
    }
  },
  en: {
    nav: { home: "Home", collection: "Collection", philosophy: "Philosophy", shop: "Shop" },
    hero: { 
      title1: "Art in", 
      title2: "every stitch.", 
      subtitle: "Quiet Luxury • Handmade • Mexico", 
      cta: "Explore Collection" 
    },
    origin: {
      label: "Our Manifesto",
      title1: "We don't design accessories,",
      title2: "we sculpt personality.",
      desc: "Each 0880 piece is born from the intersection of raw art and functional elegance. Inspired by the duality of strength and delicacy, we use hand-selected leathers.",
      badge: "Handmade"
    },
    savoir: {
      t1: "Genuine Leather", d1: "Premium selection from certified tanneries in León.",
      t2: "Hardware", d2: "High-resistance alloys with 14k gold plating.",
      t3: "Limited Edition", d3: "Small batch production to guarantee exclusivity."
    },
    banner: {
      slide1: { title: "Soft leather,", subtitle: "Thoughtful details" },
      slide2: { title: "Choose your mood", subtitle: "" }
    },
    catalog: {
      label: "The Collection · 2026",
      btn: "View Detail"
    },
    footer: {
      text: "Artisanal bags that transcend fashion to become legacy. Designed in CDMX.",
      explore: "Explore",
      social: "Social"
    }
  }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

export const staggerChildren = {
  visible: { transition: { staggerChildren: 0.2 } }
};

export const whatsappNumber = "5215633551085";
