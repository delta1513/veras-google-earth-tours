import fs from "fs";
import { feature, mesh } from "topojson-client";
import { presimplify, simplify, quantile } from "topojson-simplify";
import { geoEquirectangular, geoPath } from "d3-geo";
const res = process.argv[2] || "50m";
const W = 3600, H = 1420;
const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, 840]).clipExtent([[0, 0], [W, H]]);
const path = geoPath(proj).digits(0);
const q = +(process.argv[3] || 0.2);
let land = JSON.parse(fs.readFileSync(`node_modules/world-atlas/land-${res}.json`));
let countries = JSON.parse(fs.readFileSync(`node_modules/world-atlas/countries-${res}.json`));
land = presimplify(land); land = simplify(land, quantile(land, q));
countries = presimplify(countries); countries = simplify(countries, quantile(countries, q));
const landD = path(feature(land, land.objects.land));
const borders = mesh(countries, countries.objects.countries, (a, b) => a !== b);
const bordersD = path(borders);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
<rect width="${W}" height="${H}" fill="#8fd0f0"/>
<path d="${landD}" fill="#f3e9c6" stroke="#d9c98f" stroke-width="2" stroke-linejoin="round"/>
<path d="${bordersD}" fill="none" stroke="#d9c98f" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
`;
fs.writeFileSync(`world-${res}-${q}.svg`, svg);
console.log(res, svg.length);
