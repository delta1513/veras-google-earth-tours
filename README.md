# Earth

A home screen of Google Earth places for Vera. It is a static world map with pins. Tap a pin to see big cards for the places in that region. Tap a card to open the place in the Google Earth app.

There is no text to read in the UI on purpose. Vera cannot read sentences. See `AGENTS.md` for the design rules.

## Run

```
npm install
npm run dev      # local dev server
npm run build    # static export to out/
npm run lint
npm run test:e2e  # build, then run the Playwright tests
npm run preview  # build, then serve with wrangler dev
```

The site is a Next.js static export served by a Cloudflare Worker (`wrangler.jsonc`).

## Where the data lives

All pins and places are in `data/places.json`. Each region has an `id`, a fixed `lat` and `lng` for its pin, and a list of `places`. Each place has a `name`, a Google Earth `url`, and a `thumbnail` (a path such as `/thumbs/sydney.jpg` for a file in `public/thumbs/`, or `null`).

## Map

`public/world.svg` is a flat world map made from Natural Earth data (public domain). It uses an equirectangular projection from longitude -180 to 180 and latitude 84 to -58. The bounds and the pin projection are in `app/map.ts`. If you change one, change the other.

## Adding places

A scheduled Claude routine adds one place from time to time. The steps are in `.claude/skills/add-earth-link/SKILL.md`. Thumbnail credits are in `public/thumbs/CREDITS.md`.
