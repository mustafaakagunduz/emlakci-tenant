// One-time script: fills lat/lng for every district in src/geo/data/districts.json
// by querying Nominatim (OpenStreetMap) search endpoint, respecting its 1 req/sec
// usage policy. Output is written back into districts.json and committed to the
// repo so the running app never calls Nominatim for district coordinates.
//
// Usage: node scripts/fetch-district-coords.js
//
// Requires Node 18+ (built-in fetch).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'geo', 'data');
const PROVINCES_PATH = path.join(DATA_DIR, 'provinces.json');
const DISTRICTS_PATH = path.join(DATA_DIR, 'districts.json');

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  'EmlakPanel/1.0 (dev-script; contact: claudehesabimiz@gmail.com)';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeDistrict(districtName, provinceName) {
  const query = `${districtName}, ${provinceName}, Türkiye`;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'tr' },
  });

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status} for "${query}"`);
  }

  const results = await response.json();
  if (!results.length) {
    return null;
  }

  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

async function main() {
  const provinces = JSON.parse(fs.readFileSync(PROVINCES_PATH, 'utf8'));
  const districts = JSON.parse(fs.readFileSync(DISTRICTS_PATH, 'utf8'));
  const provinceById = new Map(provinces.map((p) => [p.id, p]));

  let done = 0;
  let failed = 0;

  for (const district of districts) {
    if (district.lat != null && district.lng != null) {
      done += 1;
      continue;
    }

    const province = provinceById.get(district.provinceId);
    try {
      const coords = await geocodeDistrict(district.name, province.name);
      if (coords) {
        district.lat = coords.lat;
        district.lng = coords.lng;
      } else {
        failed += 1;
        console.warn(`No result for ${district.name}, ${province.name}`);
      }
    } catch (err) {
      failed += 1;
      console.warn(`Failed for ${district.name}, ${province.name}: ${err.message}`);
    }

    done += 1;
    if (done % 25 === 0) {
      fs.writeFileSync(DISTRICTS_PATH, JSON.stringify(districts));
      console.log(`Progress: ${done}/${districts.length} (failed: ${failed})`);
    }

    await sleep(1100);
  }

  fs.writeFileSync(DISTRICTS_PATH, JSON.stringify(districts));
  console.log(`Done. ${done}/${districts.length} processed, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
