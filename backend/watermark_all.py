import os
import io
import math
from PIL import Image as PILImage, ImageDraw, ImageFont

MEDIA_DIR = r"d:\Buildmelk\backend\media\materials\images"

def apply_watermark_to_file(filepath, text="BUILDME.LK"):
    try:
        base = PILImage.open(filepath).convert("RGBA")
        width, height = base.size

        font_size = max(14, int(min(width, height) / 16))
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

        diagonal = int(math.sqrt(width ** 2 + height ** 2)) * 2
        tile_img = PILImage.new("RGBA", (diagonal, diagonal), (255, 255, 255, 0))
        tile_draw = ImageDraw.Draw(tile_img)

        step_x = int(font_size * 7)
        step_y = int(font_size * 3.5)

        for y in range(0, diagonal, step_y):
            for x in range(0, diagonal, step_x):
                offset_x = (y // step_y) % 2 * (step_x // 2)
                tile_draw.text((x + offset_x, y), text, fill=(139, 68, 52, 75), font=font)

        rotated = tile_img.rotate(-45, resample=PILImage.BICUBIC, expand=False)
        
        rw, rh = rotated.size
        left = (rw - width) // 2
        top = (rh - height) // 2
        cropped_watermark = rotated.crop((left, top, left + width, top + height))

        watermarked = PILImage.alpha_composite(base, cropped_watermark)

        ext = os.path.splitext(filepath)[1].lower()
        if ext in ['.jpg', '.jpeg', '.avif']:
            watermarked = watermarked.convert("RGB")
            watermarked.save(filepath, format="JPEG", quality=90)
        else:
            watermarked.save(filepath, format="PNG")
        print(f"Watermarked {os.path.basename(filepath)} successfully.")
    except Exception as e:
        print(f"Failed to watermark {filepath}: {e}")

if __name__ == "__main__":
    if os.path.exists(MEDIA_DIR):
        for fname in os.listdir(MEDIA_DIR):
            fpath = os.path.join(MEDIA_DIR, fname)
            if os.path.isfile(fpath) and fname.lower().endswith(('.png', '.jpg', '.jpeg', '.avif', '.webp')):
                apply_watermark_to_file(fpath)
