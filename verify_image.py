
import base64
import io
from PIL import Image

b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOQkxQBAAAuwhAAVjAq6Fv8IzAAAAAElFTkSuQmCC'
try:
    data = base64.b64decode(b64)
    img = Image.open(io.BytesIO(data))
    img.load()
    print("Image loaded successfully")
    print(f"Size: {img.size}")
    print(f"Format: {img.format}")
except Exception as e:
    print(f"Error loading image: {e}")
