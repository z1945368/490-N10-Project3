// geocode_reports.js
// Node script to add GEOCODES attribute to each report in reports.json
// Uses OpenStreetMap Nominatim API (https://nominatim.openstreetmap.org)
// - Respects rate limit (1 request per second)
// - Caches results in geocode_cache.json
// - Writes enriched file to reports_geocoded.json

const fs = require('fs');
const path = require('path');

// If your node doesn't expose fetch you can `npm install node-fetch` and uncomment:
// const fetch = require('node-fetch');

const REPORTS_PATH = path.join(__dirname, 'reports.json');
const CACHE_PATH = path.join(__dirname, 'geocode_cache.json');
const OUT_PATH = path.join(__dirname, 'reports_geocoded.json');

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

async function loadCache(){
  try {
    const text = fs.readFileSync(CACHE_PATH, 'utf8');
    const data = JSON.parse(text);
    return data || {};
  } catch(e){
    return {};
  }
}

async function saveCache(cache){
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

function normalizePlace(place){
  // replace slashes and double spaces; remove extra punctuation environment
  if (!place) return '';
  return place.replace(/\s*\/\s*/g, ', ').replace(/\s+/g, ' ').trim();
}

async function geocodePlace(place){
  // Call OSM Nominatim Search API and return {lat, lon, display_name}
  // Add `email` param if you want to identify yourself per usage policy.
  const q = encodeURIComponent(place);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'NIU-D3Map/1.0 (student@example.edu)' } });
    if (!res.ok) {
      console.warn('Nominatim returned status', res.status, res.statusText);
      return null;
    }
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const obj = arr[0];
    return {
      lat: Number(obj.lat),
      lon: Number(obj.lon),
      display_name: obj.display_name
    };
  } catch(err){
    console.warn('geocode error for', place, err && err.message);
    return null;
  }
}

async function main(){
  console.log('Loading reports.json ...');
  const fl = fs.readFileSync(REPORTS_PATH, 'utf8');
  const reports = JSON.parse(fl);

  const cache = await loadCache();
  console.log('Cache entries:', Object.keys(cache).length);

  const allPlaces = new Set();
  reports.forEach(r => {
    if (r.PLACES && Array.isArray(r.PLACES)){
      r.PLACES.forEach(p => allPlaces.add(normalizePlace(p)));
    }
  });

  // geocode only unique normalized place strings
  const placesList = Array.from(allPlaces).filter(Boolean);
  console.log('Unique places to check:', placesList.length);

  for (let i = 0; i < placesList.length; ++i){
    const p = placesList[i];
    if (cache[p]) continue; // already have
    console.log(`Geocoding [${i+1}/${placesList.length}]:`, p);
    const result = await geocodePlace(p);
    if (result) {
      cache[p] = result;
    } else {
      cache[p] = null; // remember failed so we don't hammer...
    }
    // Respect Nominatim rate limit: 1 request per second
    await sleep(1100);
  }

  // attach geocodes to each report
  const enriched = reports.map(r => {
    const geocodes = [];
    if (r.PLACES && Array.isArray(r.PLACES)){
      r.PLACES.forEach(p => {
        const norm = normalizePlace(p);
        const entry = cache[norm];
        if (entry) {
          geocodes.push({ place: p, lat: entry.lat, lon: entry.lon, display_name: entry.display_name });
        }
      })
    }
    return Object.assign({}, r, { GEOCODES: geocodes });
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2), 'utf8');
  await saveCache(cache);
  console.log('Done! Wrote', OUT_PATH);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
