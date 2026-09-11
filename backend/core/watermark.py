import io
import math
from PIL import Image as PILImage, ImageDraw, ImageFont
from django.core.files.base import ContentFile

def add_watermark_to_file(image_field, text="BUILDME.LK"):
    """Applies a 45-degree multi-row transparent watermark in memory before model save."""
    if not image_field:
        return
    try:
        image_field.seek(0)
        base = PILImage.open(image_field).convert("RGBA")
        width, height = base.size

        font_size = max(18, int(min(width, height) / 14))
        font = None
        font_candidates = [
            "DejaVuSans-Bold.ttf",
            "DejaVuSans.ttf",
            "arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        for f in font_candidates:
            try:
                font = ImageFont.truetype(f, font_size)
                break
            except Exception:
                continue
        if not font:
            try:
                font = ImageFont.load_default(size=font_size)
            except Exception:
                font = ImageFont.load_default()

        # Tile grid large enough to cover 45 degree rotation
        diagonal = int(math.sqrt(width ** 2 + height ** 2)) * 2
        tile_img = PILImage.new("RGBA", (diagonal, diagonal), (255, 255, 255, 0))
        tile_draw = ImageDraw.Draw(tile_img)

        step_x = max(120, int(font_size * 8))
        step_y = max(60, int(font_size * 4))

        for y in range(0, diagonal, step_y):
            for x in range(0, diagonal, step_x):
                offset_x = (y // step_y) % 2 * (step_x // 2)
                # Visible semi-transparent terracotta text
                tile_draw.text((x + offset_x, y), text, fill=(139, 68, 52, 110), font=font)

        rotated = tile_img.rotate(-45, resample=PILImage.BICUBIC, expand=False)
        
        rw, rh = rotated.size
        left = (rw - width) // 2
        top = (rh - height) // 2
        cropped = rotated.crop((left, top, left + width, top + height))

        watermarked = PILImage.alpha_composite(base, cropped)
        watermarked_rgb = watermarked.convert("RGB")

        buf = io.BytesIO()
        watermarked_rgb.save(buf, format="JPEG", quality=92)
        
        raw_name = image_field.name if hasattr(image_field, 'name') and image_field.name else 'image.jpg'
        clean_name = raw_name.rsplit('.', 1)[0] + '.jpg' if '.' in raw_name else raw_name + '.jpg'
        
        # Save watermarked content to the image field without triggering extra model save
        if hasattr(image_field, 'save'):
            image_field.save(clean_name, ContentFile(buf.getvalue()), save=False)
        else:
            image_field.file = ContentFile(buf.getvalue(), name=clean_name)
            image_field.name = clean_name
    except Exception as err:
        print("Watermark generation error:", err)
