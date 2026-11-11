"""Light 360x270 thumbnails for the home-page tiles (owner 11.11: tiles loaded half-drawn on phones). Source: public/media/<art>.jpg.
Run after changing a tile photo or chipArt in public/app.js:  python3 tools/make-tiles.py"""
import re, os
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(root + '/public/app.js', encoding='utf-8').read()
arts = sorted(set(re.search(r"const chipArt=\{([^}]*)\}", src).group(1).replace("'", '').replace(' ', '').split(',')) and
              {kv.split(':')[1] for kv in re.search(r"const chipArt=\{([^}]*)\}", src).group(1).replace("'", '').split(',')})
os.makedirs(root + '/public/media-tiles', exist_ok=True)
W, H = 360, 270
for a in arts:
    im = Image.open(f'{root}/public/media/{a}.jpg').convert('RGB')
    whole = a in ('artur-coke-glass', 'mado-gubernator-050')  # shown with object-fit: contain on white
    if whole:
        im.thumbnail((W - 16, H - 16), Image.LANCZOS); out = Image.new('RGB', (W, H), 'white'); out.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
    else:  # cover 4:3
        r = max(W / im.width, H / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        l, t = (im.width - W) // 2, (im.height - H) // 2; out = im.crop((l, t, l + W, t + H))
    out.save(f'{root}/public/media-tiles/{a}.jpg', quality=78, optimize=True, progressive=False)
print(len(arts), 'tiles')
