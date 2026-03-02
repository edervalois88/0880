import fitz  # PyMuPDF
import json
import os

pdf_file = "c:\\Users\\EderV\\0880\\0880.pdf"
output_dir = "c:\\Users\\EderV\\0880\\public\\images\\extracted"

pdf_document = fitz.open(pdf_file)
page_info = []

for page_number in range(len(pdf_document)):
    page = pdf_document.load_page(page_number)
    text = page.get_text()
    
    image_list = page.get_images(full=True)
    images = []
    
    for image_index, img in enumerate(image_list, start=1):
        image_ext = img[7] if isinstance(img[7], str) and img[7] else "jpeg" # Usually ext is at index 7 or we can infer from before, but let's just use the filename prefix
        if 'png' in str(img):
            ext = 'png'
        else:
            ext = 'jpeg'
        # Just use wildcard or search later, or let's use the actual file name we saved
        images.append(f"page_{page_number}_{image_index}")

    page_info.append({
        "page": page_number,
        "text": text.strip().replace("\n", " "),
        "images": images
    })

with open("c:\\Users\\EderV\\0880\\pdf_mapping.json", "w", encoding="utf-8") as f:
    json.dump(page_info, f, indent=2, ensure_ascii=False)

print("Mapping created at pdf_mapping.json")
