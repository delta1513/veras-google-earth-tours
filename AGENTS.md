<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# About this project

This site is a map of the world for Vera. She uses it on an iPad in Safari.

It is a static page. The page shows a world map with red pins. Vera taps a pin. A sheet with big cards opens on top of the map. One card shows one place in that region. A card has a thumbnail, a short name, and a big green arrow. Vera taps a card. The card is a link to Google Earth. The Google Earth app is installed on the iPad. It opens the link.

Vera cannot use Google Maps. Her family shows her places in the world with this site.

A scheduled Claude routine adds one new place from time to time. The routine pushes straight to `main`. The skill `add-earth-link` (in `.claude/skills/add-earth-link/SKILL.md`) tells the routine what to do. Use that skill when you add a place.

Cloudflare serves the site as the Worker `veras-google-earth-tours`. The address is https://veras-google-earth-tours.deltadelta.workers.dev/. The home screen at vera.deltadelta.dev has an icon that links to this address.


## Who Vera is

Vera is a stroke survivor. She was born in the 1960s. She did not grow up with technology, so her knowledge of it is limited. She is the main user of every system in this project.

Vera has these limits:

- She cannot use her right hand. She uses one hand only.
- She cannot read written text, except simple single words. She can connect one word to one object or one action.
- She cannot understand a sentence.
- She cannot speak, except a few simple, practiced words and sounds.
- She cannot say some letters of the alphabet. She can say most of them.

Vera depends on visual cues. She uses them to remember a flow in a user interface. She also uses them to understand a situation and to connect a word to an object or action.

Vera can do these things:

- She can copy text with the QWERTY keyboard on her phone, if the text is on the screen. If the screen shows "Banana", she can type "Banana".
- She can follow a complex flow after someone teaches her. For example, she learned to touch and hold text to start text-to-speech on her Apple phone.
- She knows some apps after instruction: messages, phone, contacts, Facebook, and WhatsApp.

## Rules for every change

Vera cannot understand text. Therefore, think about her limits before you add or change any feature. For example, do not add an alert pop-up, because she cannot read it. Use buttons with images or emojis that show the action.

You must obey these rules:

- Do not add sentences, instructions, labels, or error messages to the UI.
- Do not use `alert`, `confirm`, `prompt`, or a text dialog.
- Show each action with an emoji, an icon, a picture, or a color.
- Keep each flow short, and keep it the same every time. Vera learns a flow by memory.
- Make each touch target large.
- Make sure that one hand can reach every control on a phone.
- Do not require speech, and do not require a gesture that needs two hands.
- Do not require a complex gesture, such as a pinch or a drag, unless Vera can learn it.
- If a word appears, it must be a single simple word that has a picture next to it.
- Show what happened with a clear visual result, for example a trophy or a sad face.
- Do not remove or rename a control that Vera already knows, unless there is a strong reason.
- Do not assume that Vera knows a common web pattern. Menus, swipes, and hidden controls can confuse her.
- If a new feature needs text to work, change the design. Do not add the text.

Before you finish, ask this question: "Can Vera use this feature with one hand, without reading?" If the answer is no, change the feature.


## How this site works

All content is in `data/places.json`. A person or an AI can edit it. The app reads it at build time (`app/places.ts`). No app code changes when you add a place.

### The data file

The file has a list of regions. A region is one pin on the map. A region has a list of places. A place is one card.

```json
{
  "regions": [
    {
      "id": "europe-south",
      "lat": 40.5,
      "lng": 19.0,
      "places": [
        {
          "name": "Skopje",
          "url": "https://earth.google.com/web/@41.9961,21.4317,240a,15000d,35y,0h,0t,0r",
          "thumbnail": "/thumbs/skopje.jpg"
        }
      ]
    }
  ]
}
```

| Field | Rule |
| --- | --- |
| `id` | Unique. Kebab-case. Form: `<country-or-area>-<direction-or-island>`. Examples: `australia-east`, `australia-west`, `australia-north`, `australia-south`, `australia-tasmania`. Tasmania gets its own name because it is an island. |
| `lat`, `lng` | The fixed pin position. Choose it by hand. Put it on the map, on or near land, roughly in the middle of where the places of the region are. Latitude is from -58 to 84. Longitude is from -180 to 180. |
| `places` | A list with at least one place. |
| `name` | One simple word that Vera can connect to the picture. Two words at most. Unique in the region. |
| `url` | A Google Earth link. See "Google Earth links" below. |
| `thumbnail` | `/thumbs/<slug>.jpg`, or `null`. With `null` the card shows a grey placeholder. |

### New region or existing region

Add the place to an existing region in these cases:

- The place is within about 500 to 800 km of the pin of that region.
- The place is in the same country, area, or island group.

Make a new region in these cases:

- The place is far from every pin.
- The place is separate in meaning. For example: an island, a different country, a different continent.

The data tests enforce one rule. Two pins must be at least 8 degrees apart. The distance is Euclidean: `sqrt((lat1-lat2)^2 + (lng1-lng2)^2)`. If a new region would be closer than that to a pin, add the place to the nearby region instead.

A pin is 72 px wide. On an iPad in portrait, 8 degrees are only about 18 px. Pins that are close are hard to tap. Prefer more space when you can.

Keep it simple. Do not add clustering. Do not add a dynamic layout. Each pin has a fixed position.

### Google Earth links

Use this format:

```
https://earth.google.com/web/@<lat>,<lng>,<a>a,<d>d,35y,0h,<t>t,0r
```

| Part | Meaning |
| --- | --- |
| `lat`, `lng` | The place. Use 4 decimals. |
| `a` | Ground elevation in metres. Round it to 10. Use 0 for a regional view. |
| `d` | Camera distance in metres. Use about 1.6 times the width of the subject. A building of 190 m: 300 to 600. A city of 10 km: 15000. A region of 250 km: 500000. |
| `t` | Camera tilt. Use 60 for a landmark. Use 0 for a city view or a region view. |
| `35y`, `0h`, `0r` | Fixed. Do not change them. |

This format is inferred. Google has no official documentation for it. Nobody could check the framing by eye. A link may frame a place a little too near or too far. This is acceptable.

To get the elevation, run this command:

```
curl -sS "https://api.opentopodata.org/v1/srtm30m?locations=LAT,LNG"
```

The number after `"elevation"` is the ground elevation in metres.

### Thumbnails

- A thumbnail is a file in `public/thumbs/`. The name is `<slug>.jpg`.
- It is exactly 256 x 256 px. It is a progressive JPEG.
- Crop it from the centre. If the subject is not in the centre, use a better crop.
- Remove the metadata. Use quality about 70. The target size is 25 KB or less. The tests allow 40 KB.
- Always crop and compress with a standard tool. Never commit a raw download.
- With ImageMagick:

```
convert in.jpg -auto-orient -resize 256x256^ -gravity center -extent 256x256 -strip -interlace Plane -quality 70 public/thumbs/<slug>.jpg
```

- If ImageMagick is not installed, use `scripts/make_thumb.py` or Pillow. The skill `add-earth-link` has the commands.
- Use only free licences: CC BY, CC BY-SA, CC0, or public domain. Credit every image in `public/thumbs/CREDITS.md`.
- Always look at the final image. It must be clear and easy to recognise.

### The map

- `public/world.svg` is a flat world map. It uses the equirectangular projection. The latitude is from 84 to -58. The longitude is from -180 to 180. The size is 3600 x 1420 (10 units for each degree).
- `app/map.ts` has the same bounds and the function `project()`. `project()` turns lat and lng into percent. If you change the SVG bounds, change `app/map.ts` too.
- The script `scripts/gen-world-svg.mjs` makes a new SVG from Natural Earth data. The packages `world-atlas`, `topojson-client`, `topojson-simplify`, and `d3-geo` must be installed outside the project. Do not add them to `package.json`. Run these commands:

```
mkdir -p /tmp/worldgen && cp scripts/gen-world-svg.mjs /tmp/worldgen/ && cd /tmp/worldgen
npm init -y && npm install world-atlas topojson-client topojson-simplify d3-geo
node gen-world-svg.mjs 50m 0.15    # writes world-50m-0.15.svg
```

- The arguments are the data resolution (`50m` or `110m`) and the simplify quantile. The script writes the file into the folder where you run it. The script gives a different sea colour than the committed map (`#8fd0f0` against `#9bd4f2`). Check the result by eye before you replace `public/world.svg`. The sea colour must match the page background in `app/globals.css`.
- Do not regenerate the map unless it is necessary.

### UI rules for this app

These rules come from the rules above. Do not break them.

- The UI has no text except the place names on the cards.
- A pin has a touch area of at least 64 px (it is 72 px now).
- A card is at least 96 px high. A card is one `<a>` element. It opens in the same tab. Do not add `target`.
- The close button is big and red. It is at the bottom-left, so the left hand can reach it.
- Do not add dialogs, alerts, or hidden controls.
- Keep the test hooks. These are the `data-testid` values: `map`, `pin` (with `data-region`), `overlay`, `backdrop`, `sheet`, `card`, `placeholder`, `close`.

## Testing

| Command | Result |
| --- | --- |
| `npm run test:e2e` | Builds the site. Then runs Playwright with Chromium at iPad landscape (1180 x 820) and iPad portrait (820 x 1180). Also runs the data tests. |
| `npx playwright test --project=data --trace off` | Runs only the data tests. It needs no browser. It does not build the site. |

- The data-only run still starts the test web server. The server waits for `out/index.html`. If the folder `out/` does not exist, run `mkdir -p out && touch out/index.html` first. Git ignores `out/`. `npm run build` replaces it.
- If the browser is missing, run `npx playwright install chromium`.
- The tests are data-driven. They read `data/places.json`. A new place needs no test change.
- Always pass `--trace off` to Playwright. The `test:e2e` script does this.
- If a test fails after you add a place, fix the data. Do not change the tests.

## Git

This project pushes directly to `main`. The rules in section 10 of the template guide below apply. Never force-push. If a push is rejected, run `git pull --no-rebase origin main` and push again.

# Agent guide for this template

This file is written in Simplified Technical English. Each sentence has one meaning. Read all of it before you change any file.

## 1. What this repository is

This repository is a template. It contains a hello-world Next.js app. The app builds to a static site. Cloudflare Workers serves the static site.

The user copies this template to make a hobby project. Your task is to build the app that the user asks for. You start from this template.

Cloudflare builds and deploys the site by itself. Cloudflare does this each time someone pushes to the `main` branch. No GitHub workflow is necessary. Do not add one.

## 2. Stack

| Part | Choice |
| --- | --- |
| Framework | Next.js 16 with the App Router |
| Language | TypeScript |
| Output | Static export (`output: "export"`) to the `out/` folder |
| Host | A Cloudflare Worker that serves static assets |
| Deploy tool | Wrangler (`wrangler.jsonc`) |
| Package manager | npm |

TypeScript 7 runs side by side with TypeScript 6. In `package.json`, `typescript` is an alias to `@typescript/typescript6`, and `@typescript/native` is TypeScript 7 (it provides the `tsc` command). This is needed because typescript-eslint does not yet support TypeScript 7 (see typescript-eslint issue 10940). Do not change this alias until typescript-eslint supports TypeScript 7.

The Next.js version in this repository is new. It has breaking changes. Your training data can be wrong. Before you write code, read the guide in `node_modules/next/dist/docs/`. Run `npm install` first if that folder does not exist.

## 3. Files in this repository

| Path | Purpose |
| --- | --- |
| `app/` | Pages and layouts (App Router) |
| `app/layout.tsx` | Root layout and page metadata |
| `app/page.tsx` | The home page |
| `app/globals.css` | Global CSS |
| `next.config.ts` | Sets `output: "export"` and `images.unoptimized` |
| `wrangler.jsonc` | Tells Cloudflare the Worker name, the build command, and the asset folder |
| `package.json` | Scripts and dependencies |
| `package-lock.json` | Locked dependency versions. Commit it. |
| `tsconfig.json` | TypeScript settings. The `@/*` alias points to the repository root. |
| `eslint.config.mjs` | Lint rules |
| `data/` | `places.json`: all regions, pins, places, and links |
| `e2e/` | Playwright tests and the small web server for them |
| `scripts/` | Helper scripts: `make_thumb.py` (thumbnails) and `gen-world-svg.mjs` (map) |
| `public/thumbs/` | Thumbnails of places, and `CREDITS.md` |
| `public/world.svg` | The world map image |
| `.claude/skills/` | Skills for agents. `add-earth-link` adds a new place. |
| `out/` | Build output. Git ignores it. Do not edit it. |

## 4. Commands

| Command | Result |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the static site to `out/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Build, then serve `out/` with `wrangler dev` |
| `npm run deploy` | Deploy by hand with `wrangler deploy` |
| `npm run test:e2e` | Build the site, then run the Playwright tests |

Cloudflare runs `npm run build`. The `build.command` field in `wrangler.jsonc` sets this command. Do not remove that field.

## 5. How to start a new project from this template

The initial setup of this project is already done. Do not repeat it.

## 6. What the static export can and cannot do

The static export runs Next.js at build time only. The result is HTML, CSS, and JavaScript files. No server runs after the build.

These features work:

- Server Components. They run during `npm run build`.
- Client Components (`'use client'`).
- Client-side navigation with `next/link`.
- Client-side data fetching in the browser.
- Dynamic routes that have `generateStaticParams()`.
- Route Handlers that have `export const dynamic = 'force-static'` and use only `GET`.
- CSS, CSS Modules, and Tailwind CSS.
- `next/image` with `images.unoptimized: true`. This is the current setting.
- Browser APIs such as `window` and `localStorage`, inside `useEffect` only.

These features do not work. The build fails, or the feature does nothing:

- Server Actions.
- Cookies and request headers.
- Route Handlers that read the request.
- Dynamic routes without `generateStaticParams()`.
- `rewrites`, `redirects`, and `headers` in `next.config.ts`.
- Proxy (middleware).
- Incremental Static Regeneration and Draft Mode.
- Image optimization with the default image loader.

If the user needs a feature from the second list, stop. The user needs a different template. See section 8.

To store data between visits, use `localStorage` in a Client Component. To load data, use a public API from the browser. You can also load data at build time in a Server Component.

## 7. Rules for code changes

- Keep `output: "export"` in `next.config.ts`. Keep `images: { unoptimized: true }` too.
- Put static files, such as images and fonts, in a `public/` folder at the repository root. Create the folder if it does not exist. Next.js copies these files to `out/`. Refer to them with a path that starts with `/`.
- Add a page with a new folder in `app/`. The folder contains a `page.tsx` file. The folder name is the URL path.
- Add a `not-found.tsx` file in `app/` to change the 404 page. Cloudflare serves `404.html` for unknown URLs.
- Use `next/link` for links between pages. Cloudflare serves `/about` and `/about/` correctly. The `html_handling` setting in `wrangler.jsonc` controls this.
- Use a Client Component when the code needs state, effects, event handlers, or browser APIs.
- Do not use Node.js APIs in code that runs in the browser.
- Do not add a database, an API server, or secret keys. A static site cannot keep a secret.
- To use Tailwind CSS, install `tailwindcss` and `@tailwindcss/postcss`. Create `postcss.config.mjs` with the `@tailwindcss/postcss` plugin. Add `@import "tailwindcss";` to `app/globals.css`.
- Keep `wrangler.jsonc` valid. Keep `assets.directory` set to `./out`. Keep `not_found_handling` set to `404-page`.
- Update `compatibility_date` in `wrangler.jsonc` only if a Cloudflare feature needs a newer date.
- Do not use `next start`. It does not work with a static export.
- Add a new dependency only if the user needs it. Run `npm install <package>`. Commit the changed `package-lock.json`.

## 8. If the app needs a server

This template serves static files only. Some apps need server code. Some apps need a database or a third-party service.

If an app needs server code, do not add it to this template. Tell the user that this template does not support it. For a dynamic app that uses no third-party services, the user can use a Worker together with a Cloudflare container. For an app that uses a database or storage, the user can use Cloudflare bindings.

Cloudflare documentation exists in markdown form. Add `index.md` to the end of any documentation URL. For example, read `https://developers.cloudflare.com/workers/index.md`. This uses fewer tokens than the HTML page.

## 9. Checks before you push

Do these checks in order. Fix each problem before you go to the next check.

1. Run `npm run lint`. It must pass.
2. Run `npm run build`. It must pass, and `out/index.html` must exist.
3. Run `npm run test:e2e`. It must pass.
4. Run `npx wrangler deploy --dry-run`. It must show that it read the files from the assets folder.
5. Run `git status`. Make sure that no `out/`, `node_modules/`, `.env`, or `.wrangler/` files are staged.

Optional: run `npm run preview` and open the local address. This shows the site in the Workers runtime. If you cannot open a browser, skip this step.

## 10. Git rules

- Push directly to `main`. This is a hobby project. No pull request is necessary. The user can tell you to use a branch or a pull request instead.
- Never force-push. Never rewrite history. Never use `git push --force` or `git reset --hard` on shared history.
- Keep the git history. Add new commits.
- Write clear commit messages.
- If a push is rejected, run `git pull --no-rebase` and push again. If you cannot resolve a conflict, ask the user.
- Do not commit secrets.

After you push, Cloudflare builds the site. You cannot see the Cloudflare build from here. Tell the user to check the build in the Cloudflare dashboard.

## 11. What the user must do in Cloudflare

You cannot do these steps. The user does them one time. Tell the user about them if the site does not deploy.

### 11.1 Connect Cloudflare to GitHub (one time for each account)

1. Log in to the Cloudflare dashboard.
2. Go to Workers & Pages.
3. Start to create an application. Choose the GitHub option.
4. Follow the prompts. Install the Cloudflare app in GitHub.
5. Give the app access to the repository. The user can choose all repositories or only selected repositories.

### 11.2 Create the Worker (one time for each project)

1. Make the GitHub repository first. Use this template.
2. In the Cloudflare dashboard, go to Workers & Pages.
3. Click Create application.
4. Choose GitHub.
5. Select the repository. Follow the prompts.
6. Make sure that the Worker name is the same as `name` in `wrangler.jsonc`.
7. Leave the build command and the deploy command as the defaults, unless the user has a reason to change them. The repository files already set the build.
8. Save and deploy.

### 11.3 Make the site public

1. Open the Worker in the Cloudflare dashboard.
2. Go to Settings, then Domains & Routes.
3. Enable the `workers.dev` domain.
4. Open the `workers.dev` address. The site is now public.

The user can add a custom domain in the same place.

### 11.4 After the setup

Each push to `main` starts a new build and deploy. The build log is in the Worker, under Deployments or Builds. If the build fails, read the log. Fix the error in the code. Push again.

## 12. Common problems

| Problem | Cause and fix |
| --- | --- |
| The Cloudflare build fails with a name error | The Worker name in Cloudflare is different from `name` in `wrangler.jsonc`. Make the two names the same. |
| The Cloudflare build cannot find a package | `package-lock.json` is not committed, or it is out of date. Run `npm install` and commit the file. |
| `npm run build` fails on a server feature | The code uses a feature from the second list in section 6. Remove it. |
| A dynamic route fails in the build | Add `generateStaticParams()` to the route. |
| `window is not defined` | Code that uses `window` runs on the server. Move it into `useEffect` in a Client Component. |
| The site shows the 404 page for a valid URL | Check that `out/` contains the page. Check `html_handling` in `wrangler.jsonc`. |
| An image does not load | Put the file in `public/`. Use a path that starts with `/`. |
| The site shows old content | Wait for the Cloudflare build to finish. Then reload with the cache cleared. |
