import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://movie-tv-app-sass.onrender.com/api';

function MovieCard({ item, openPlayer, isContinueWatching = false }) {
  const title = item.title || item.name;

  return (
    <div className="movie-card" style={{ position: 'relative' }}>
      <img
        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750'}
        alt={title}
        loading="lazy"
        className="card-poster"
      />
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        
        {isContinueWatching && item.isTvShow && (
          <p style={{ color: '#0071e3', fontSize: '0.8rem', margin: '4px 0', fontWeight: 'bold' }}>
            S{item.season} E{item.episode}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', fontSize: '0.85rem', color: '#a1a1a6' }}>
          <span>⭐ IMDb: <strong style={{ color: '#f5c518' }}>{item.imdbRating || 'N/A'}</strong></span>
        </div>

        <div className="btn-group">
          <button onClick={() => openPlayer(item, item.season, item.episode)} className="btn-watch" style={{ width: '100%' }}>
            ▶ {isContinueWatching ? 'Resume' : 'Watch Online'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 🎯 Adsterra Native Banner Component
function AdsterraNativeBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      const script = document.createElement('script');
      script.src = 'https://pl31523509.profitableratecpmnetwork.com/4c10f54fc39e0e91b896cb10b0ea89c5/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');

      const container = document.createElement('div');
      container.id = 'container-4c10f54fc39e0e91b896cb10b0ea89c5';

      adRef.current.appendChild(script);
      adRef.current.appendChild(container);
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0 20px 0', width: '100%', minHeight: '100px' }}>
      <div ref={adRef} style={{ width: '100%', textAlign: 'center' }} />
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('home');
  const [loading, setLoading] = useState(false);

  // States
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [trending, setTrending] = useState([]);
  const [animation, setAnimation] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Pagination Limits
  const [visibleRecentCount] = useState(20);
  const [visibleTrendingCount] = useState(20);
  const [visibleAnimCount] = useState(20);

  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Player States
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDetails, setMediaDetails] = useState(null);
  const [castList, setCastList] = useState([]);
  const [isTvShow, setIsTvShow] = useState(false);
  const [seasonsList, setSeasonsList] = useState([]);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [playerServer, setPlayerServer] = useState('videasy');

  useEffect(() => {
    loadContinueWatching();
    fetchHomeData();

    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadContinueWatching = () => {
    const saved = localStorage.getItem('continue_watching');
    if (saved) {
      try {
        setContinueWatching(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveToContinueWatching = (media, currentSeason, currentEpisode, isTv) => {
    let currentList = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    currentList = currentList.filter(item => item.id !== media.id);

    const newItem = {
      ...media,
      season: currentSeason || 1,
      episode: currentEpisode || 1,
      isTvShow: isTv,
      updatedAt: new Date().getTime()
    };

    currentList.unshift(newItem);
    localStorage.setItem('continue_watching', JSON.stringify(currentList));
    setContinueWatching(currentList);
  };

  const clearContinueWatching = () => {
    localStorage.removeItem('continue_watching');
    setContinueWatching([]);
  };

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [recentRes, trendingRes, animRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/recent-movies`),
        axios.get(`${BACKEND_URL}/trending`),
        axios.get(`${BACKEND_URL}/animation`)
      ]);

      setRecentMovies(recentRes.data || []);
      setTrending(trendingRes.data || []);
      setAnimation(animRes.data || []);
    } catch (err) {
      console.error("Home Fetch Error:", err);
    }
    setLoading(false);
  };

  const handleHomeClick = () => {
    setQuery('');
    setViewMode('home');
    setShowSuggestions(false);
    fetchHomeData();
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length > 1) {
      try {
        const res = await axios.get(`${BACKEND_URL}/search?q=${encodeURIComponent(value)}`);
        if (res.data) {
          setSuggestions(res.data.slice(0, 8));
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Arrow Key Navigation & Auto Input Update
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (selectedIndex + 1) % suggestions.length;
      setSelectedIndex(nextIndex);
      setQuery(suggestions[nextIndex].title || suggestions[nextIndex].name);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
      setSelectedIndex(prevIndex);
      setQuery(suggestions[prevIndex].title || suggestions[prevIndex].name);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        selectSuggestion(suggestions[selectedIndex]);
      } else {
        setShowSuggestions(false);
        executeSearch(query);
      }
    }
  };

  const selectSuggestion = (item) => {
    const title = item.title || item.name;
    setQuery(title);
    setShowSuggestions(false);
    executeSearch(title);
  };

  const executeSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setViewMode('search');
    try {
      const res = await axios.get(`${BACKEND_URL}/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openPlayer = async (item, savedSeason = 1, savedEpisode = 1) => {
    setSelectedMedia(item);
    setSeason(savedSeason);
    setEpisode(savedEpisode);

    const isTv = item.media_type === 'tv' || !!item.first_air_date || !!item.name || item.isTvShow;
    setIsTvShow(isTv);

    saveToContinueWatching(item, savedSeason, savedEpisode, isTv);

    const type = isTv ? 'tv' : 'movie';
    const TMDB_KEY = '0b9a32d27f4c52441dade736b680c9e5';

    try {
      const [detailsRes, creditsRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_KEY}`),
        axios.get(`https://api.themoviedb.org/3/${type}/${item.id}/credits?api_key=${TMDB_KEY}`)
      ]);

      setMediaDetails(detailsRes.data);
      setCastList(creditsRes.data.cast ? creditsRes.data.cast.slice(0, 15) : []);

      if (isTv && detailsRes.data.seasons) {
        setSeasonsList(detailsRes.data.seasons.filter((s) => s.season_number > 0));
      }
    } catch (err) {
      console.error("Media details error:", err);
    }
  };

  const handleSeasonChange = (s) => {
    setSeason(s);
    setEpisode(1);
    saveToContinueWatching(selectedMedia, s, 1, isTvShow);
  };

  const handleEpisodeChange = (e) => {
    setEpisode(e);
    saveToContinueWatching(selectedMedia, season, e, isTvShow);
  };

  const getEmbedUrl = () => {
    if (!selectedMedia) return '';
    const id = selectedMedia.id;
    if (playerServer === 'vidfast') {
      return isTvShow ? `https://vidfast.pro/tv/${id}/${season}/${episode}` : `https://vidfast.pro/movie/${id}`;
    }
    if (playerServer === 'vidsrc_me') {
      return isTvShow ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` : `https://vidsrc.me/embed/movie?tmdb=${id}`;
    }
    return isTvShow ? `https://player.videasy.net/tv/${id}/${season}/${episode}` : `https://player.videasy.net/movie/${id}`;
  };

  const getCurrentEpisodeCount = () => {
    if (seasonsList.length > 0) {
      const currentS = seasonsList.find((s) => Number(s.season_number) === Number(season));
      if (currentS && currentS.episode_count) {
        return currentS.episode_count;
      }
    }
    return 24;
  };

  return (
    <div className="apple-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 🚀 MAIN CONTENT WRAPPER */}
      <main style={{ flex: 1 }}>
        {/* Header */}
        <div className="apple-header">
          <h1 className="apple-title">Movies & TV Series</h1>
          <p className="apple-subtitle">Stream unlimited HD content with working Fast Servers.</p>

          <div style={{ display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
            <button onClick={handleHomeClick} style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer' }}>
              🏠
            </button>

            {/* Search Wrapper */}
            <div ref={searchContainerRef} style={{ flex: 1 }}>
              <form 
                onSubmit={(e) => { e.preventDefault(); executeSearch(query); }} 
                className="search-box"
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                {/* Input Wrapper */}
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search titles..."
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <ul style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: '0', 
                      width: '100%', 
                      backgroundColor: '#1c1c1e', 
                      borderRadius: '12px', 
                      padding: '8px 0', 
                      listStyle: 'none', 
                      zIndex: 1000,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      marginTop: '6px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {suggestions.map((item, index) => (
                        <li 
                          key={item.id} 
                          onClick={() => selectSuggestion(item)} 
                          style={{ 
                            padding: '10px 16px', 
                            cursor: 'pointer', 
                            backgroundColor: index === selectedIndex ? 'rgba(255,255,255,0.15)' : 'transparent', 
                            color: '#fff',
                            fontSize: '0.9rem',
                            textAlign: 'left'
                          }}
                        >
                          {item.title || item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button type="submit" className="search-button" style={{ whiteSpace: 'nowrap' }}>Search</button>
              </form>
            </div>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#86868b', marginTop: '40px' }}>Loading content...</p>
        ) : viewMode === 'search' ? (
          <div style={{ marginTop: '20px' }}>
            <h2>Search Results for "{query}"</h2>
            <div className="movie-grid">
              {searchResults.map((item) => (
                <MovieCard key={item.id} item={item} openPlayer={openPlayer} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '20px' }}>
            
            {/* 1. 🔄 CONTINUE WATCHING SECTION */}
            {continueWatching.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#0071e3' }}>
                    ▶ Continue Watching
                  </h2>
                  <button onClick={clearContinueWatching} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Clear All
                  </button>
                </div>
                <div className="movie-grid">
                  {continueWatching.map((item) => (
                    <MovieCard key={item.id} item={item} openPlayer={openPlayer} isContinueWatching={true} />
                  ))}
                </div>
              </div>
            )}

            {/* 2. 🆕 RECENT MOVIES */}
            {recentMovies.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', fontWeight: '600', color: '#34c759' }}>
                  🆕 Recent Releases
                </h2>
                <div className="movie-grid">
                  {recentMovies.slice(0, visibleRecentCount).map((item) => (
                    <MovieCard key={item.id} item={item} openPlayer={openPlayer} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. 🔥 TRENDING NOW */}
            {trending.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', fontWeight: '600', color: '#ff9500' }}>
                  🔥 Trending Now
                </h2>
                <div className="movie-grid">
                  {trending.slice(0, visibleTrendingCount).map((item) => (
                    <MovieCard key={item.id} item={item} openPlayer={openPlayer} />
                  ))}
                </div>
              </div>
            )}

            {/* 4. 🎨 ANIMATION & ANIME */}
            {animation.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '15px', fontWeight: '600', color: '#af52de' }}>
                  🎨 Animation & Anime
                </h2>
                <div className="movie-grid">
                  {animation.slice(0, visibleAnimCount).map((item) => (
                    <MovieCard key={item.id} item={item} openPlayer={openPlayer} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* 🎯 ALWAYS AT THE BOTTOM FOOTER AD SECTION */}
      <footer style={{ marginTop: 'auto', width: '100%' }}>
        <AdsterraNativeBanner />
      </footer>

      {/* Player Modal */}
      {selectedMedia && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '50px 20px' }}>
          <div style={{ maxWidth: '950px', width: '100%', margin: '0 auto', position: 'relative' }}>
            <button onClick={() => setSelectedMedia(null)} style={{ position: 'absolute', top: '-15px', right: '-10px', background: '#2c2c2e', color: '#fff', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}>✕</button>

            <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '14px 20px', background: '#161618', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginRight: 'auto' }}>
                  {selectedMedia.title || selectedMedia.name}
                </span>

                {isTvShow && (
                  <>
                    <label style={{ fontSize: '0.85rem', color: '#a1a1a6' }}>
                      Season:
                      <select value={season} onChange={(e) => handleSeasonChange(Number(e.target.value))} style={{ marginLeft: '6px', background: '#2c2c2e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px' }}>
                        {seasonsList.length > 0 ? (
                          seasonsList.map((s) => (
                            <option key={s.id || s.season_number} value={s.season_number}>Season {s.season_number}</option>
                          ))
                        ) : (
                          <option value={1}>Season 1</option>
                        )}
                      </select>
                    </label>

                    <label style={{ fontSize: '0.85rem', color: '#a1a1a6' }}>
                      Episode:
                      <select value={episode} onChange={(e) => handleEpisodeChange(Number(e.target.value))} style={{ marginLeft: '6px', background: '#2c2c2e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px' }}>
                        {Array.from({ length: getCurrentEpisodeCount() }, (_, i) => i + 1).map((ep) => (
                          <option key={ep} value={ep}>Episode {ep}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                <label style={{ fontSize: '0.85rem', color: '#a1a1a6' }}>
                  Server:
                  <select value={playerServer} onChange={(e) => setPlayerServer(e.target.value)} style={{ marginLeft: '6px', background: '#2c2c2e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px' }}>
                    <option value="videasy">Server 1 (VidEasy 1080p)</option>
                    <option value="vidfast">Server 2 (VidFast)</option>
                    <option value="vidsrc_me">Server 3 (VidSrc)</option>
                  </select>
                </label>
              </div>

              <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe src={getEmbedUrl()} allowFullScreen title="Movie Player" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}></iframe>
              </div>
            </div>

            {/* Details & Cast */}
            <div style={{ background: 'rgba(28, 28, 30, 0.85)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <img
                  src={selectedMedia.poster_path ? `https://image.tmdb.org/t/p/w300${selectedMedia.poster_path}` : 'https://via.placeholder.com/150x225'}
                  alt={selectedMedia.title || selectedMedia.name}
                  style={{ width: '130px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', margin: '0 0 10px 0' }}>
                    {selectedMedia.title || selectedMedia.name}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: '#d1d1d6', lineHeight: '1.5' }}>
                    {mediaDetails?.overview || selectedMedia?.overview || "No overview available."}
                  </p>

                  {castList.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px' }}>CAST</h4>
                      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {castList.map((actor) => (
                          <div key={actor.id} style={{ minWidth: '70px', textAlign: 'center' }}>
                            <img
                              src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/70x70'}
                              alt={actor.name}
                              style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <p style={{ fontSize: '0.7rem', color: '#fff', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;