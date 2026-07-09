#!/usr/bin/env python3
"""Quita el fondo claro (blanco/gris/degradado) de las imagenes de categorias.

Usa crecimiento de region (BFS) desde los bordes: un pixel se vuelve
transparente si es "claro" Y esta conectado al borde a traves de otros pixeles
claros. Asi se respetan los blancos internos del instrumento (parches de
bateria, teclas, etc.) porque no son alcanzables desde el borde.

Lee de las carpetas originales en el Escritorio y escribe PNG transparente
recortado al contenido en public/images/categorias/.
"""
import os
from collections import deque
from PIL import Image, ImageFilter

DESKTOP = "/Users/cesargv/Desktop"
SRC1 = os.path.join(DESKTOP, "Categorias RSW")
SRC2 = os.path.join(DESKTOP, "Categorias RSW 2")
DST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "images", "categorias")
)

# (archivo_origen, carpeta, nombre_salida)
JOBS = [
    ("Guitarraacustica1.png", SRC1, "guitarra-acustica.png"),
    ("GuitarraElectrica1.png", SRC1, "guitarra-electrica.png"),
    ("Bajo1.png", SRC1, "bajo.png"),
    ("Docerola1.png", SRC1, "docerola.png"),
    ("Violin1.png", SRC1, "violin.png"),
    ("Ukulele1.png", SRC1, "ukulele.png"),
    ("Bateria1.png", SRC1, "bateria.png"),
    ("Teclado1.png", SRC1, "teclado.png"),
    ("Bafles.png", SRC1, "bafles.png"),
    ("Accesorios.jpeg", SRC1, "accesorios.png"),
    ("Guitarraacustica2.png", SRC2, "guitarra-acustica-2.png"),
    ("Guitarraelectrica2.png", SRC2, "guitarra-electrica-2.png"),
    ("Bajo2.png", SRC2, "bajo-2.png"),
    ("docerola2.png", SRC2, "docerola-2.png"),
    ("Violin2.png", SRC2, "violin-2.png"),
    ("Ukulele2.png", SRC2, "ukulele-2.png"),
    ("Bateria2.jpeg", SRC2, "bateria-2.png"),
    ("Teclado2.png", SRC2, "teclado-2.png"),
]

# Un pixel es "fondo claro" si sus 3 canales superan este valor.
LIGHT = 200

def is_light(px):
    return px[0] >= LIGHT and px[1] >= LIGHT and px[2] >= LIGHT

def process(src_name, folder, out_name):
    path = os.path.join(folder, src_name)
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()

    bg = bytearray(w * h)  # 1 = fondo a remover
    dq = deque()

    def seed(x, y):
        i = y * w + x
        if not bg[i] and is_light(px[x, y]):
            bg[i] = 1
            dq.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while dq:
        x, y = dq.popleft()
        if x > 0:
            seed(x - 1, y)
        if x < w - 1:
            seed(x + 1, y)
        if y > 0:
            seed(x, y - 1)
        if y < h - 1:
            seed(x, y + 1)

    rgba = im.convert("RGBA")
    ap = rgba.load()
    removed = 0
    for y in range(h):
        row = y * w
        for x in range(w):
            if bg[row + x]:
                r, g, b, _ = ap[x, y]
                ap[x, y] = (r, g, b, 0)
                removed += 1

    # suavizar borde del alpha
    alpha = rgba.split()[3].filter(ImageFilter.GaussianBlur(0.6))
    rgba.putalpha(alpha)

    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)

    os.makedirs(DST, exist_ok=True)
    rgba.save(os.path.join(DST, out_name))
    pct = removed * 100 // (w * h)
    print(f"{out_name:28} fondo removido: {pct:3}%  final: {rgba.size}")

for job in JOBS:
    process(*job)
print("Listo.")
