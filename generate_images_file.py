
import base64
import io
from PIL import Image

colors = [
    ("30,25,20", (30, 25, 20)),
    ("180,80,60", (180, 80, 60)),
    ("220,210,180", (220, 210, 180)),
    ("50,160,50", (50, 160, 50)),
    ("150,90,50", (150, 90, 50)),
    ("230,230,225", (230, 230, 225))
]

with open("test_images_base64.txt", "w") as f:
    for name, c in colors:
        img = Image.new('RGB', (1, 1), c)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        f.write(f"CASE {name}: {b64}\n")

print("Generated test_images_base64.txt")
