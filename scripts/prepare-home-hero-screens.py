"""Project original captures onto the existing photographed displays, never AI text.

Requires Pillow and numpy. Coordinates refer to the untouched 1672 x 941 art.
Only screen interiors are replaced; metal, notches, glass edge and contact shadows stay.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SCALE = 4
SPECS = {
    'plantao': {'box': (490, 192, 739, 780),
                'quad': [(516, 207), (738, 193), (724, 779), (491, 768)],
                'radius': 120},
    'prova': {'box': (933, 199, 1171, 782),
              'quad': [(934, 199), (1154, 207), (1170, 770), (938, 782)],
              'radius': 150},
}

for name, spec in SPECS.items():
    source = Image.open(ROOT / f'design/home-hero-v2/{name}.png').convert('RGBA')
    w, h = source.size
    # Bottom corners follow the physical glass, upper edge meets its status bar.
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, w-1, h-1), radius=spec['radius'], fill=255)
    draw.rectangle((0, 0, w, h//2), fill=255)
    # Join the clean capture to the photographed status-bar glass, before any
    # original UI text begins. This removes the hard horizontal colour seam.
    for y in range(16):
        draw.line((0, y, w, y), fill=round(255*y/15))
    source.putalpha(mask)
    left, top, right, bottom = spec['box']
    destination = [((x-left)*SCALE, (y-top)*SCALE) for x, y in spec['quad']]
    rows, values = [], []
    for (x, y), (u, v) in zip(destination, [(0,0),(w,0),(w,h),(0,h)]):
        rows += [[x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]]
        values += [u,v]
    inverse = np.linalg.solve(np.array(rows), np.array(values))
    result = source.transform(((right-left)*SCALE, (bottom-top)*SCALE),
                              Image.Transform.PERSPECTIVE, inverse,
                              Image.Resampling.BICUBIC)
    result.save(ROOT / f'design/home-hero-v3/desktop-screen-{name}.png')
    print(name, result.size, spec['box'])
