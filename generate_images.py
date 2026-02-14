
import base64
import io
from PIL import Image

colors = [
    (30, 25, 20),    # Dark
    (180, 80, 60),   # Red
    (220, 210, 180), # Bright
    (50, 160, 50),   # Green
    (150, 90, 50),   # Brown
    (230, 230, 225)  # White
]

print("---")
for c in colors:
    img = Image.new('RGB', (1, 1), c)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    print(f"Color {c}: {b64}")
