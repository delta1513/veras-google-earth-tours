#!/usr/bin/env python3
"""usage: make_thumb.py "<Wikipedia title>" <slug> <outdir>
Prints JSON: lat, lng, source page, author, licence. Writes <outdir>/<slug>.jpg (256x256 progressive JPEG)."""
import json, subprocess, sys, time, re, urllib.parse, io
from PIL import Image, ImageOps
UA = "VeraTours/1.0 (hobby project; vera.deltadelta.dev)"
def get(url, tries=6):
    import tempfile, os
    for _ in range(tries):
        with tempfile.NamedTemporaryFile(delete=False) as h: hp=h.name
        r = subprocess.run(["curl","-sS","-L","-A",UA,"-D",hp,"-w","\n%{http_code}",url],capture_output=True)
        hdr=open(hp,"rb").read(); os.unlink(hp)
        body,code=r.stdout.rsplit(b"\n",1); code=code.decode()
        if code=="429":
            m=re.search(rb"(?i)retry-after: *(\d+)",hdr); time.sleep(int(m.group(1))+2 if m else 30); continue
        if code!="200": raise SystemExit(f"HTTP {code} for {url}")
        return body
    raise SystemExit("rate limited")
title,slug,outdir=sys.argv[1:4]
Q=urllib.parse.quote
s=json.loads(get("https://en.wikipedia.org/api/rest_v1/page/summary/"+Q(title.replace(" ","_"))))
fname=None
t=s.get("thumbnail",{}).get("source","")
if "/wikipedia/commons/" in t and not t.split("?")[0].lower().endswith(".svg.png") and ".svg" not in t.lower():
    fname=urllib.parse.unquote(t.split("?")[0].split("/")[-2])   # lead image is a normal Commons photo
if not fname and s.get("wikibase_item"):                           # fallback: Wikidata image (P18)
    time.sleep(2)
    wd=json.loads(get("https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&ids="+s["wikibase_item"]))
    for c in wd["entities"][s["wikibase_item"]]["claims"].get("P18",[]):
        fname=c["mainsnak"]["datavalue"]["value"].replace(" ","_"); break
if not fname: raise SystemExit("no usable photo: choose one by hand from Commons")
time.sleep(2)
info=json.loads(get("https://commons.wikimedia.org/w/api.php?action=query&formatversion=2&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&titles="+Q("File:"+fname)))
ii=info["query"]["pages"][0]["imageinfo"][0]; m=ii["extmetadata"]
strip=lambda x: re.sub(r"<[^>]+>","",x or "")
time.sleep(2)
raw=get(ii["thumburl"].split("?")[0].replace("thumb.wikimedia.org","upload.wikimedia.org"))
img=Image.open(io.BytesIO(raw)); img=ImageOps.exif_transpose(img)
if img.mode in ("P","LA","RGBA"):
    img=img.convert("RGBA"); bg=Image.new("RGBA",img.size,"white"); bg.alpha_composite(img); img=bg
img=ImageOps.fit(img.convert("RGB"),(256,256),Image.LANCZOS,centering=(0.5,0.5))
img.save(f"{outdir}/{slug}.jpg","JPEG",quality=70,progressive=True,optimize=True)
print(json.dumps({"lat":s.get("coordinates",{}).get("lat"),"lng":s.get("coordinates",{}).get("lon"),"page":ii["descriptionurl"],
 "author":strip(m.get("Artist",{}).get("value")),"licence":m.get("LicenseShortName",{}).get("value")},indent=1))
