const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Memory Cache: පැය 24ක් (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400 });

const TMDB_API_KEY = process.env.TMDB_API_KEY || '0b9a32d27f4c52441dade736b680c9e5';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '2a1d81b9';

// 🟢 ROOT ROUTE (Cron-Job සහ Health Check සඳහා)
app.get('/', (req, res) => {
  res.status(200).send('Server is running healthy!');
});

async function getOmdbImdbRating(imdbId, tmdbVote) {
  const defaultRating = tmdbVote ? tmdbVote.toFixed(1) : 'N/A';
  if (!imdbId) return { imdbRating: defaultRating };

  const cacheKey = `imdb_only_${imdbId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const res = await axios.get(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`);
    let imdbRating = defaultRating;
    if (res.data && res.data.imdbRating && res.data.imdbRating !== 'N/A') {
      imdbRating = res.data.imdbRating;
    }
    const ratingData = { imdbRating };
    cache.set(cacheKey, ratingData);
    return ratingData;
  } catch (err) {
    return { imdbRating: defaultRating };
  }
}

// Helper function to enrich TMDB list with IMDb ratings
async function enrichWithImdb(items, mediaTypeDefault = 'movie') {
  return await Promise.all(
    items.map(async (item) => {
      const type = item.media_type || (item.first_air_date ? 'tv' : mediaTypeDefault);
      try {
        const extRes = await axios.get(
          `https://api.themoviedb.org/3/${type}/${item.id}/external_ids?api_key=${TMDB_API_KEY}`
        );
        const ratings = await getOmdbImdbRating(extRes.data.imdb_id, item.vote_average);
        return { ...item, ...ratings, media_type: type };
      } catch {
        return { ...item, imdbRating: item.vote_average ? item.vote_average.toFixed(1) : 'N/A', media_type: type };
      }
    })
  );
}

// 🌐 SITEMAP.XML ENDPOINT (Google Search Console සඳහා)
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  const baseUrl = 'https://movies.cyberhomesimple.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  res.send(xmlContent);
});

// 1. RECENT MOVIES
app.get('/api/recent-movies', async (req, res) => {
  const cacheKey = 'recent_movies_v2';
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const tmdbRes = await axios.get(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    const enriched = await enrichWithImdb(tmdbRes.data.results || [], 'movie');
    cache.set(cacheKey, enriched);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent movies' });
  }
});

// 2. TRENDING NOW ENDPOINT
app.get('/api/trending', async (req, res) => {
  const cacheKey = 'trending_now_v1';
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const tmdbRes = await axios.get(
      `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`
    );
    const enriched = await enrichWithImdb(tmdbRes.data.results || []);
    cache.set(cacheKey, enriched);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending titles' });
  }
});

// 3. ANIMATION & ANIME (MOVIES + TV SHOWS) ENDPOINT (Genre ID 16 = Animation)
app.get('/api/animation', async (req, res) => {
  const cacheKey = 'animation_all_v2';
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    // Movies සහ TV Shows (Anime) දෙකෙන්ම Animation Data Fetch කිරීම
    const [animMoviesRes, animTvRes] = await Promise.all([
      axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=16&sort_by=popularity.desc`),
      axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&sort_by=popularity.desc`)
    ]);

    const animMovies = animMoviesRes.data.results || [];
    const animTv = animTvRes.data.results || [];

    // Movies සහ TV Shows එකට මිශ්‍ර කර ගැනීම
    const combined = [];
    const maxLen = Math.max(animMovies.length, animTv.length);
    for (let i = 0; i < maxLen; i++) {
      if (animTv[i]) combined.push({ ...animTv[i], media_type: 'tv' });
      if (animMovies[i]) combined.push({ ...animMovies[i], media_type: 'movie' });
    }

    const enriched = await enrichWithImdb(combined.slice(0, 20));
    cache.set(cacheKey, enriched);
    res.json(enriched);
  } catch (err) {
    console.error("Animation fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch animation content' });
  }
});

// 4. SEARCH ENDPOINT
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  const cacheKey = `search_v2_${query.toLowerCase().trim()}`;
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

  try {
    const tmdbRes = await axios.get(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const enriched = await enrichWithImdb((tmdbRes.data.results || []).slice(0, 10));
    cache.set(cacheKey, enriched);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));