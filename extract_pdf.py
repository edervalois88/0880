import fitz  # PyMuPDF
import io
from PIL import Image
import os

pdf_file = "c:\\Users\\EderV\\0880\\0880.pdf"
output_dir = "c:\\Users\\EderV\\0880\\public\\images\\extracted"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Opening {pdf_file}")
pdf_document = fitz.open(pdf_file)

image_count = 0
for page_number in range(len(pdf_document)):
    page = pdf_document.load_page(page_number)
    image_list = page.get_images(full=True)
    
    if image_list:
        print(f"[+] Found {len(image_list)} images on page {page_number}")
    for image_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = pdf_document.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Save the image
            image_name = f"page_{page_number}_img_{image_index}.{image_ext}"
            image_path = os.path.join(output_dir, image_name)
            
            # Since some images might have weird colorspaces, let's just save them normally or convert
            if image.mode == "CMYK":
                image = image.convert("RGB")
                
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            print(f"Saved: {image_name}")
            image_count += 1
        except Exception as e:
            print(f"Error saving image on page {page_number}: {e}")

print(f"Total images extracted: {image_count}")
