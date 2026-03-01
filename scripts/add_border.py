import cv2
import sys
import os
import numpy as np
from PIL import Image

def addBorder(path: str):
    # Load image once
    image = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if image is None:
        print(f"Error: Could not load image at {path}")
        return None

    # Ensure 4 channels (BGRA)
    if image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)

    alpha = image[:, :, 3]
    _, binary_mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)

    # Create the border via dilation
    border_thickness = 3
    kernel = np.ones((border_thickness, border_thickness), np.uint8)
    dilated_mask = cv2.dilate(binary_mask, kernel, iterations=7)

    # Create new background with border color (White: B=255, G=255, R=255, A=255)
    new_image = np.zeros(image.shape, dtype=np.uint8)
    new_image[dilated_mask == 255] = [255, 255, 255, 255]
    
    # Overlay original image where it isn't transparent
    mask = alpha > 10
    new_image[mask] = image[mask]

    return new_image

def compress_and_save(cv2_img, output_path, colors=256):
    """
    Converts OpenCV image to Pillow, quantizes, and saves to disk.
    """
    try:
        # Convert BGR(A) to RGB(A) for Pillow
        # OpenCV uses BGR, Pillow uses RGB
        rgb_image = cv2.cvtColor(cv2_img, cv2.COLOR_BGRA2RGBA)
        pil_img = Image.fromarray(rgb_image)

        # Quantize using the adaptive palette (no external dependencies)
        # We use 'RGBA' -> 'P' to preserve transparency mapping
        compressed_img = pil_img.convert("P", palette=Image.ADAPTIVE, colors=colors)
        
        # Save to disk
        compressed_img.save(output_path, "PNG", optimize=True)
        
        print(f"Process complete. Saved to: {output_path}")
        print(f"Final Size: {os.path.getsize(output_path) / 1024:.2f} KB")

    except Exception as e:
        print(f"An error occurred during compression: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <image_path>")
    else:
        target_path = sys.argv[1]
        
        # 1. Process the image in memory
        processed_mem_image = addBorder(target_path)
        
        # 2. Compress and save the result
        if processed_mem_image is not None:
            compress_and_save(processed_mem_image, target_path)