---
name: add-earth-link
description: Use this skill when you are asked to add, recommend, or discover a new place (a Google Earth link) for Vera's Earth map. This includes scheduled runs, where no human watches.
---

# Add one place to Vera's Earth map

This skill is written in Simplified Technical English. Each sentence has one meaning.

A scheduled routine can run this skill. No human watches. Do the steps in order. Do not skip a step. Do not ask questions. If a step fails, follow the instruction in that step.

## 0. Goal

Add exactly ONE new place. Then push it to `main`.

## 1. Read the project rules

1. Make sure that you work on the newest `main`:

```
git checkout main
git pull --no-rebase origin main
```

2. Read `AGENTS.md`. It describes Vera's limits and the rules. It also has the data rules, the link format, and the thumbnail rules. Obey all of them.
3. Read `data/places.json`.

## 2. Choose a place

Choose a place that has all of these qualities:

- It is famous, beautiful, and easy to recognise in a picture.
- It is joyful. Examples: a landmark, a natural wonder, a familiar city or village, animals, gardens, a beach.
- It is NOT yet in `data/places.json`. Check the names and the coordinates.
- A picture is enough to understand it. It needs no text.

Prefer a region that has few places. The world must fill evenly.

Do not choose a war zone, a disaster site, or anything upsetting.

Vera was born in the 1960s. Her family shows her the world. Mix famous places with homely places. Do not overthink this. A sensible default is enough.

## 3. Get coordinates and a photo

Choose a `slug`: lowercase letters, numbers, and hyphens. Example: `eiffel`. Choose a Wikipedia title. Example: `Eiffel Tower`.

Run this command. It needs `python3`, Pillow, and `curl`. Run it from the repository root.

```
python3 -I scripts/make_thumb.py "<Wikipedia title>" <slug> public/thumbs
```

The command writes `public/thumbs/<slug>.jpg`. It prints JSON with `lat`, `lng`, `page` (source page), `author`, and `licence`. Write these values down. You need them in steps 4, 5, and 6.

If the command prints `no usable photo`, or the photo is poor, use the manual steps below.

### Manual steps

Use these steps when the script fails. Wait 2 to 5 seconds between calls.

```
UA="VeraTours/1.0 (hobby project; vera.deltadelta.dev)"
T="<Wikipedia_title_with_underscores>"
# a. Coordinates and the Wikidata id
curl -sSfL -A "$UA" "https://en.wikipedia.org/api/rest_v1/page/summary/$T"
# b. The Wikidata image. Q123 is the "wikibase_item" from step a. The file name is in claims.P18.
curl -sSfL -A "$UA" "https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&ids=Q123"
# c. The 500 px thumbnail URL, author, and licence. FILE is the file name from step b, with underscores.
curl -sSfL -A "$UA" "https://commons.wikimedia.org/w/api.php?action=query&formatversion=2&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&titles=File:FILE"
# d. Download the 500 px thumbnail ("thumburl" from step c). Remove everything after "?".
#    Replace thumb.wikimedia.org with upload.wikimedia.org.
curl -sSfL -A "$UA" -o /tmp/raw.jpg "<thumburl>"
```

For another photo of the same place, list the files in the Commons category. Some results are not images. Choose a `.jpg` file, and use it in step c.

```
curl -sSfL -A "$UA" "https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:<Name>&cmtype=file&cmlimit=30&format=json"
```

### Rules for photos

- Never download the original file. Request a 500 px thumbnail only.
- Use only a free licence: CC BY, CC BY-SA, CC0, or public domain. Do not use a photo with a non-free licence. Do not hotlink a photo.
- The lead image of an article can be bad. It can be a locator map, a logo, or a wide panorama. Reject it. Look at the final picture and decide.
- Find the BEST image. It must be bright and clear. The subject must be in the centre. Vera must recognise it without words. If the first photo is poor, try another photo from the Commons category.
- If you find no free image after a real effort, set `"thumbnail": null`. The card then shows a grey placeholder. Skip step 4 in this case.

### Rate limits

- Wikimedia can answer HTTP 429. Wait the number of seconds in the `retry-after` header, plus 2 seconds. Then try again.
- Space your calls 2 to 5 seconds apart.
- Always send the User-Agent `VeraTours/1.0 (hobby project; vera.deltadelta.dev)`. Do not put personal details in it.

## 4. Crop, compress, and check the thumbnail

`make_thumb.py` already crops and compresses. If you used the manual steps, or if you want a better crop, run this command. `/tmp/raw.jpg` is the downloaded file.

```
convert /tmp/raw.jpg -auto-orient -resize 256x256^ -gravity center -extent 256x256 -strip -interlace Plane -quality 70 public/thumbs/<slug>.jpg
```

If `convert` is not installed, use Pillow:

```
python3 -I -c "
import sys
from PIL import Image, ImageOps
im = ImageOps.exif_transpose(Image.open(sys.argv[1])).convert('RGB')
ImageOps.fit(im, (256, 256), Image.LANCZOS, centering=(0.5, 0.5)).save(sys.argv[2], 'JPEG', quality=70, progressive=True, optimize=True)
" /tmp/raw.jpg public/thumbs/<slug>.jpg
```

If the subject is not in the centre, use `-gravity north`, `south`, `east`, or `west` in the `convert` command. Or change `centering=(0.5, 0.5)` in the Pillow command.

Check the file. The command must print no error:

```
python3 -I -c "
import sys, os
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f); kb = os.path.getsize(f) / 1024
    print(f, im.format, im.size, 'progressive' if im.info.get('progressive') else 'baseline', f'{kb:.1f} KB')
    assert im.format == 'JPEG' and im.size == (256, 256) and kb <= 25 and im.info.get('progressive'), 'BAD THUMBNAIL'
" public/thumbs/<slug>.jpg
```

Then LOOK at the image. Use the Read tool on `public/thumbs/<slug>.jpg`. It must be clear and recognisable. If it is not, go back to step 3 and choose another photo.

Add one row at the end of the table in `public/thumbs/CREDITS.md`. Use the values from step 3:

```
| <slug>.jpg | <source page> | <author> | <licence> |
```

## 5. Build the Google Earth link

Format: `https://earth.google.com/web/@<lat>,<lng>,<a>a,<d>d,35y,0h,<t>t,0r`

1. Take `lat` and `lng` from step 3. Round them to 4 decimals.
2. Get the ground elevation `a`:

```
curl -sS "https://api.opentopodata.org/v1/srtm30m?locations=<lat>,<lng>"
```

   Round the `elevation` to the nearest 10. If the call fails, use 0. For a region view, use 0.
3. Set `d` to about 1.6 times the width of the subject in metres. A building of 190 m: 300 to 600. A city of 10 km: 15000. A region of 250 km: 500000.
4. Set `t` to 60 for a landmark. Set `t` to 0 for a city view or a region view.
5. Keep `35y`, `0h`, and `0r` as they are.

Example (not checked by eye): `https://earth.google.com/web/@48.8582,2.2945,40a,500d,35y,0h,60t,0r`

Nobody can verify the framing. That is acceptable.

## 6. Edit `data/places.json`

1. Decide the region. Add the place to an existing region if it is within about 500 to 800 km of its pin, or in the same country, area, or island group.
2. Make a new region if the place is far from every pin, or separate in meaning (an island, a different country, a different continent).
   - `id`: kebab-case, `<country-or-area>-<direction-or-island>`. Example: `australia-tasmania`.
   - `lat`, `lng`: the pin position. Choose it by hand. It must be on the map, on or near land, roughly in the middle of where the places of the region are.
   - The pin must be at least 8 degrees away from every other pin. The distance is `sqrt((lat1-lat2)^2 + (lng1-lng2)^2)`. If it is closer, do not make a new region. Add the place to the nearby region.
3. Add the place at the END of the `places` list of its region:

```json
{
  "name": "Eiffel",
  "url": "https://earth.google.com/web/@48.8582,2.2945,40a,500d,35y,0h,60t,0r",
  "thumbnail": "/thumbs/eiffel.jpg"
}
```

4. `name` is one simple word that Vera can connect to the picture. Two words at most. It must be unique in the region.
5. Keep 2-space indentation and valid JSON. Do not change other places.

## 7. Verify

Run these commands from the repository root. Run `npm ci` first if `node_modules/` does not exist.

```
npm run lint
npm run test:e2e
```

If the browser is missing, run `npx playwright install chromium` and try again.

If `npm run test:e2e` cannot run here, run only the data tests. This needs `out/index.html`. Create it if it is missing:

```
mkdir -p out && touch out/index.html
npx playwright test --project=data --trace off
```

If a test fails, fix the data (not the tests). Try again. If it still fails after two attempts, do NOT push. Remove only the files that this run made:

```
git checkout -- data/places.json public/thumbs/CREDITS.md
rm -f public/thumbs/<slug>.jpg
```

Then end the run with a short note about what failed.

## 8. Commit and push to `main`

```
git pull --no-rebase origin main
git add data/places.json public/thumbs
git commit -m "Add <Name> (<region id>)"
git push origin main
```

- If the push is rejected, run `git pull --no-rebase origin main`, and push again.
- Never force-push. Never rewrite history.
- If the environment does not allow a push to `main`, do not work around the permission. Report this in your final note.

## 9. Final report

End the run with exactly 3 lines:

1. The place and its name in the data file.
2. The region id, and whether the region is new or existing.
3. The image source page and its licence (or "no image" if the thumbnail is `null`).

## Do not

- Do not edit app code, CSS, or tests in a routine run.
- Do not add text, labels, or dialogs to the UI.
- Do not add more than one place.
- Do not change existing places, except to fix an obvious error.
- Do not commit raw downloads, `out/`, `node_modules/`, or `test-results/`.
