import json
import os
import re

pdf_mapping_file = "c:\\Users\\EderV\\0880\\pdf_mapping.json"
extracted_dir = "c:\\Users\\EderV\\0880\\public\\images\\extracted"
constants_file = "c:\\Users\\EderV\\0880\\app\\data\\constants.js"

with open(pdf_mapping_file, "r", encoding="utf-8") as f:
    mapping = json.load(f)

files_in_extracted = os.listdir(extracted_dir)

def get_image_for_page(page_num):
    prefix = f"page_{page_num}_img_1"
    for file in files_in_extracted:
        if file.startswith(prefix):
            return f"/images/extracted/{file}"
    return ""

products_data = []
current_collection = "Valentina"

for item in mapping:
    page = item["page"]
    text = item["text"]
    if page == 0:
        continue

    # Determine collection
    lower_text = text.lower()
    if page >= 1 and page <= 10:
        current_collection = "Valentina"
    elif page >= 11 and page <= 20:
        current_collection = "Love"
    elif page >= 21 and page <= 26:
        current_collection = "Amelia"
    elif page >= 27 and page <= 32:
        current_collection = "Inés"
    elif page >= 33 and page <= 44:
        current_collection = "Accesorios"

    # Price extraction
    # The price format is usually something like $4,200.00
    price_match = re.search(r'\$\s*(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?', text)
    price = 0
    if price_match:
        price = int(price_match.group(1).replace(",", ""))
    else:
        # Defaults based on collection
        prices = {"Valentina": 4200, "Love": 4250, "Amelia": 3900, "Inés": 3800, "Accesorios": 750}
        price = prices.get(current_collection, 0)

    design = "Diseño"
    design_match = re.search(r'\(([^)]+)\)', text)
    if design_match:
        design = design_match.group(1).strip().capitalize()
        
    color = "Color"
    color_match = re.search(r'Color\s+([A-Za-záéíóúÁÉÍÓÚñÑ\s/]+)(?:\$|Aro|Strap|$)', text, re.IGNORECASE)
    if color_match:
        color = color_match.group(1).strip()
        color = re.sub(r'(Aro\s+de\s+Metal|Strap|Bolsa).*', '', color, flags=re.IGNORECASE).strip()
    else:
        if "Print Serpiente" in text:
            color = "Print Serpiente"
        elif "Print Reptil" in text:
            color = "Print Reptil"

    name_dict = {
        "Valentina": "Valentina",
        "Love": "Love",
        "Amelia": "Amelia",
        "Inés": "Inés",
        "Accesorios": "Monedero Olan"
    }

    image_path = get_image_for_page(page)

    product = {
        "id": page,
        "name": name_dict[current_collection],
        "collection": current_collection,
        "price": price,
        "image": image_path,
        "color": color.capitalize(),
        "design": design,
        "desc": {
            "es": text,
            "en": text
        },
        "features": ["Piel 100% vacuna"]
    }
    products_data.append(product)

import urllib.request
    
js_content = f"""// Catálogo completo 0880 - Piel 100% vacuna mexicana
export const productsData = {json.dumps(products_data, indent=2, ensure_ascii=False)};

export const translations = {{
  es: {{
    nav: {{ home: "Inicio", collection: "Catálogo", philosophy: "Filosofía", shop: "Tienda" }},
    hero: {{ 
      title1: "Arte en", 
      title2: "cada puntada.", 
      subtitle: "Lujo Silencioso • Hecho a Mano • León, Gto.", 
      cta: "Ver Catálogo" 
    }},
    origin: {{
      label: "Nuestro Origen",
      title1: "Orgullosamente Mexicana",
      title2: "hecha con corazón.",
      desc: "0880mx es una marca orgullosamente mexicana creada con la intención de ayudar a artesanos y peleteros en el estado de León, Guanajuato, lugar donde se hace con mucho corazón cada bolsa con la mejor calidad en piel 100% mexicana y siempre tratando de darle identidad de nuestro país a cada pieza.",
      badge: "Hecho a mano"
    }},
    savoir: {{
      t1: "Piel Genuina", d1: "Piel 100% vacuna mexicana de la mejor calidad.",
      t2: "Artesanía", d2: "Bordados a máquina hechos con dedicación en León, Gto.",
      t3: "Identidad", d3: "Diseños únicos que reflejan el orgullo mexicano."
    }},
    banner: {{
      slide1: {{ title: "Piel suave,", subtitle: "Detalles sublimes" }},
      slide2: {{ title: "León, Guanajuato", subtitle: "Capital del calzado y piel" }} 
    }},
    catalog: {{
      label: "Catálogo 0880 · 2026",
      btn: "Consultar",
      all: "Todo",
      filter: "Filtrar por colección:",
      showing: "Mostrando",
      products: "productos"
    }},
    footer: {{
      text: "Bolsas artesanales 100% mexicanas que trascienden la moda. Hecho con corazón en León, Guanajuato.",
      explore: "Explorar",
      social: "Social"
    }}
  }},
  en: {{
    nav: {{ home: "Home", collection: "Catalog", philosophy: "Philosophy", shop: "Shop" }},
    hero: {{ 
      title1: "Art in", 
      title2: "every stitch.", 
      subtitle: "Quiet Luxury • Handmade • León, Gto.", 
      cta: "View Catalog" 
    }},
    origin: {{
      label: "Our Origin",
      title1: "Proudly Mexican",
      title2: "made with heart.",
      desc: "0880mx is a proudly Mexican brand created with the intention of helping artisans and leather workers in León, Guanajuato, where each bag is made with great care using the best quality 100% Mexican leather, always trying to give each piece the identity of our country.",
      badge: "Handmade"
    }},
    savoir: {{
      t1: "Genuine Leather", d1: "100% Mexican cowhide leather of the highest quality.",
      t2: "Craftsmanship", d2: "Machine embroidery made with dedication in León, Gto.",
      t3: "Identity", d3: "Unique designs that reflect Mexican pride."
    }},
    banner: {{
      slide1: {{ title: "Soft leather,", subtitle: "Thoughtful details" }},
      slide2: {{ title: "León, Guanajuato", subtitle: "Leather & shoe capital" }}
    }},
    catalog: {{
      label: "Catalog 0880 · 2026",
      btn: "Inquire",
      all: "All",
      filter: "Filter by collection:",
      showing: "Showing",
      products: "products"
    }},
    footer: {{
      text: "100% Mexican handcrafted bags that transcend fashion. Made with heart in León, Guanajuato.",
      explore: "Explore",
      social: "Social"
    }}
  }}
}};

export const fadeUp = {{
  hidden: {{ opacity: 0, y: 50 }},
  visible: {{ opacity: 1, y: 0, transition: {{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} }}
}};

export const staggerChildren = {{
  visible: {{ transition: {{ staggerChildren: 0.2 }} }}
}};

export const whatsappNumber = "5215633551085";
"""

with open(constants_file, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Updated {constants_file} with fixed prices.")
