import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// ==================== CONFIGURATION ====================
//const GCP_BACKEND_URL = 'http://localhost:8080'; // For local testing
//const GCP_BACKEND_URL = 'https://ndvi3-analysis-api-258557095482.us-central1.run.app';
const GCP_BACKEND_URL = 'https://ndvi4-analysis-api-258557095482.us-central1.run.app';
const SUPABASE_URL = 'https://quvbsftdyaxjqlwnjtxv.supabase.co';
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1dmJzZnRkeWF4anFsd25qdHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzI0OTEsImV4cCI6MjA3NjEwODQ5MX0.BpxqHKTvmSghuNDtLAKU-hszFJzey_oyn5_hDRZeqTg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== MAIN APP ====================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [currentPage, setCurrentPage] = useState('home');
  const [isFullPageView, setIsFullPageView] = useState(false);
  
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  if (loading) {
    return (
      <div className={`app-container loading-screen ${darkMode ? 'dark-mode' : ''}`}>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <Navigation 
        user={user} 
        setUser={setUser}
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        setShowAuthModal={setShowAuthModal}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      
      {currentPage === 'home' && (
        <LandingPage 
          user={user}
          setUser={setUser}
          setShowAuthModal={setShowAuthModal}
          setAuthView={setAuthView}
          darkMode={darkMode}
        />
      )}
      
      {currentPage === 'myanalyses' && (
        <MyAnalysesPage
          user={user}
          setShowAuthModal={setShowAuthModal}
          setAuthView={setAuthView}
          setIsFullPageView={setIsFullPageView}
        />
      )}

      {currentPage === 'community' && (
        <CommunityPage
          user={user}
          setIsFullPageView={setIsFullPageView}
        />
      )}
      
      {currentPage === 'about' && (
        <AboutPage />
      )}
      
      {currentPage === 'pricing' && (
        <PricingPage setCurrentPage={setCurrentPage} />
      )}

      {currentPage === 'billing' && (
        <BillingPage
          user={user}
          setShowAuthModal={setShowAuthModal}
          setAuthView={setAuthView}
        />
      )}

      {showAuthModal && (
        <AuthModal 
          authView={authView}
          setAuthView={setAuthView}
          setShowAuthModal={setShowAuthModal}
        />
      )}

      {!isFullPageView && <Footer />}
    </div>
  );
}

// ==================== NAVIGATION BAR ====================
function Navigation({ user, setUser, darkMode, setDarkMode, setShowAuthModal, currentPage, setCurrentPage }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [credits, setCredits] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load user credits when dropdown opens
  useEffect(() => {
    if (user && showProfileMenu) {
      loadCredits();
    }
  }, [user, showProfileMenu]);

  const loadCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCredits(data?.credits ?? 0);
    } catch (err) {
      console.error('Failed to load credits:', err);
      setCredits(0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowProfileMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setCurrentPage('home')}>
          <h1>LLEO</h1>
        </div>

        <div className="navbar-menu">
          <button 
            onClick={() => setCurrentPage('myanalyses')}
            className={`nav-link ${currentPage === 'myanalyses' ? 'active' : ''}`}
          >
            My Analyses
          </button>
          <button 
            onClick={() => setCurrentPage('community')}
            className={`nav-link ${currentPage === 'community' ? 'active' : ''}`}
          >
            Community Research
          </button>
          <button 
            onClick={() => setCurrentPage('about')}
            className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
          >
            About
          </button>
          <button 
            onClick={() => setCurrentPage('pricing')}
            className={`nav-link ${currentPage === 'pricing' ? 'active' : ''}`}
          >
            Pricing
          </button>
        </div>

        <div className="navbar-actions">
          <button onClick={() => setDarkMode(!darkMode)} className="icon-btn" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            {darkMode ? '☀' : '☾'}
          </button>

          {user ? (
            <div className="profile-menu-container" ref={profileMenuRef}>
              <button 
                className="profile-icon"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <div className="user-avatar-large">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <p className="user-email">{user.email}</p>
                      <p className="user-id">ID: {user.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="profile-divider"></div>
                  <div className="credit-display">
                    <span className="credit-label">Credits:</span>
                    <span className="credit-amount">{credits !== null ? credits : '...'}</span>
                  </div>
                  <div className="profile-divider"></div>
                  <button onClick={() => alert('Settings coming soon!')} className="dropdown-item">
                    Settings
                  </button>
                  <button onClick={() => setCurrentPage('billing')} className="dropdown-item">
                    Billing
                  </button>
                  <div className="profile-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary">
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ==================== LANDING PAGE ====================
function LandingPage({ user, setShowAuthModal, setAuthView }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState('results'); // 'results' or 'log'
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // Auto-scroll logs to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (level, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, level, message }]);
  };

  const handleAnalyze = async () => {
    if (!user) {
      alert('Please register to analyze!\n\nClick "Login / Sign Up" in the top right corner.');
      setShowAuthModal(true);
      setAuthView('signup');
      return;
    }

    if (!query.trim()) {
      setError('Please enter an analysis query');
      addLog('error', 'Missing analysis query');
      return;
    }

    // Check if user has enough credits
    try {
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (creditError) throw creditError;

      if (!creditData || creditData.credits < 1) {
        setError('Insufficient credits. Please upgrade your plan to continue.');
        addLog('error', 'Insufficient credits. You need at least 1 credit to run an analysis.');
        alert('You don\'t have enough credits!\n\nYou need at least 1 credit to run an analysis.\nGo to Billing in your profile menu to upgrade.');
        return;
      }

      addLog('info', `Current credits: ${creditData.credits}`);
    } catch (err) {
      setError('Failed to check credits');
      addLog('error', `Failed to check credits: ${err.message}`);
      return;
    }

    setLoading(true);
    setError('');
    addLog('info', `Starting analysis: "${query}"`);
    addLog('info', 'Sending query to backend...');

    try {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('user_id', user.id);

      addLog('info', 'Sending request to backend API...');
      const response = await fetch(`${GCP_BACKEND_URL}/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      addLog('success', `Analysis completed! Session ID: ${data.session_id}`);
      addLog('info', `Analysis type: ${data.analysis_type}`);
      addLog('info', `Location: ${data.location || 'Unknown'}`);

      addLog('info', 'Saving analysis to database...');
      const { data: analysisData, error: insertError } = await supabase
        .from('analyses')
        .insert([{
          user_id: user.id,
          user_email: user.email,
          session_id: data.session_id,
          query: query,
          analysis_type: data.analysis_type,
          location: data.location || 'Unknown',
          is_shared: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Deduct 1 credit using Supabase function
      addLog('info', 'Deducting 1 credit...');
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_credits', {
          p_user_id: user.id,
          p_amount: 1,
          p_analysis_id: analysisData.id,
          p_description: `Analysis: ${query.substring(0, 50)}...`
        });

      if (deductError) {
        console.error('Failed to deduct credits:', deductError);
        addLog('warning', 'Analysis completed but failed to deduct credit');
      } else if (deductResult && !deductResult.success) {
        addLog('warning', `Credit deduction issue: ${deductResult.error}`);
      } else {
        addLog('success', `Credit deducted! Remaining: ${deductResult.credits_remaining}`);
      }

      const newResult = {
        id: Date.now(),
        session_id: data.session_id,
        query: query,
        analysis_type: data.analysis_type,
        location: data.location || 'N/A',
        created_at: new Date()
      };

      setResults([newResult, ...results]);
      setSelectedResult(newResult);
      setShowChart(false);
      setQuery('');
      addLog('success', 'Analysis results ready to view!');
    } catch (err) {
      setError(err.message);
      addLog('error', `Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedResult) return;
    
    try {
      const response = await fetch(`${GCP_BACKEND_URL}/results/${selectedResult.session_id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${selectedResult.session_id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download results: ' + err.message);
    }
  };

  return (
    <div className="landing-page-split">
      <div className="left-panel">
        <div className="hero-section">
          <div className="logo-large">
            <h1>LLEO</h1>
          </div>
          <h2>Large Language Models for Earth Observation</h2>
          <p className="subtitle">
            Transform questions into comprehensive geospatial insights using advanced
            AI and satellite imagery. Powered by Google Earth Engine.
          </p>
        </div>

        <div className="input-section">
          <div className="query-input-box">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your geospatial analysis request..."
              className="query-textarea"
              rows="5"
            />
            {error && (
              <div className="input-footer">
                <div className="error-message-inline">{error}</div>
              </div>
            )}
          </div>

          <button 
            onClick={handleAnalyze} 
            className="btn-analyze"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              'Start Analysis'
            )}
          </button>
        </div>

        <div className="sample-questions">
          <p className="sample-title">Sample Questions:</p>
          <div className="sample-grid">
            <button onClick={() => setQuery('vegetation analysis Central Park New York 2020 2023')} className="sample-chip">
              Vegetation Analysis
            </button>
            <button onClick={() => setQuery('air pollution levels Beijing China')} className="sample-chip">
              Air Quality
            </button>
            <button onClick={() => setQuery('water quality Lake Michigan')} className="sample-chip">
              Water Quality
            </button>
            <button onClick={() => setQuery('find coffee shops near Zurich')} className="sample-chip">
              Location Search
            </button>
            <button onClick={() => setQuery('weather forecast Tokyo Japan')} className="sample-chip">
              Weather Forecast
            </button>
            <button onClick={() => setQuery('deforestation analysis Amazon rainforest 2020 2024')} className="sample-chip">
              Deforestation
            </button>
          </div>
        </div>

        <div className="backend-status">
          <span className="status-indicator"></span>
          Backend Connected
        </div>
      </div>

      <div className="right-panel">
        <div className="results-header">
          <div className="right-panel-tabs">
            <button
              onClick={() => setRightPanelTab('results')}
              className={`right-panel-tab ${rightPanelTab === 'results' ? 'active' : ''}`}
            >
              Analysis Results
            </button>
            <button
              onClick={() => setRightPanelTab('log')}
              className={`right-panel-tab ${rightPanelTab === 'log' ? 'active' : ''}`}
            >
              Log
            </button>
          </div>
          {rightPanelTab === 'results' && (
            <p>Your completed analyses and visualizations</p>
          )}
          {rightPanelTab === 'log' && (
            <p>Backend logs and analysis progress</p>
          )}
        </div>

        <div className="results-content">
          {rightPanelTab === 'results' && (
            <>
              {loading && (
                <div className="result-loading">
                  <div className="loading-animation">
                    <div className="spinner-large"></div>
                    <p>Running analysis...</p>
                    <p className="loading-detail">This may take a few minutes</p>
                  </div>
                </div>
              )}

              {!loading && !selectedResult && results.length === 0 && (
                <div className="empty-results">
                  <div className="empty-icon">📊</div>
                  <h4>No results yet</h4>
                  <p>Start your first analysis to see results here</p>
                </div>
              )}

              {selectedResult && (
            <div className="result-viewer">
              <div className="result-viewer-header">
                <div>
                  <h4>{selectedResult.query}</h4>
                  <p className="result-meta">
                    {selectedResult.analysis_type} • {selectedResult.location} • 
                    {new Date(selectedResult.created_at).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)} 
                  className="btn-close-viewer"
                  title="Close viewer"
                >
                  ×
                </button>
              </div>
              
              <div className="viewer-tabs">
                <button 
                  onClick={() => setShowChart(false)}
                  className={`viewer-tab ${!showChart ? 'active' : ''}`}
                >
                  Map View
                </button>
                <button 
                  onClick={() => setShowChart(true)}
                  className={`viewer-tab ${showChart ? 'active' : ''}`}
                >
                  Charts
                </button>
              </div>
              
              <div className="result-viewer-content">
                {!showChart ? (
                  <iframe
                    src={`${GCP_BACKEND_URL}/results/${selectedResult.session_id}/map`}
                    className="result-iframe"
                    title="Analysis Map"
                  />
                ) : (
                  <img
                    src={`${GCP_BACKEND_URL}/results/${selectedResult.session_id}/chart`}
                    alt="Analysis Charts"
                    className="result-chart-img"
                  />
                )}
              </div>
              
              <div className="result-viewer-actions">
                <a
                  href={`${GCP_BACKEND_URL}/results/${selectedResult.session_id}/map`}
                  className="btn btn-secondary btn-small"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={handleDownload}
                  className="btn btn-primary btn-small"
                >
                  Download Results
                </button>
              </div>
            </div>
          )}

          {!selectedResult && results.length > 0 && (
            <div className="results-list">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="result-card"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="result-header-card">
                    <span className="result-badge">{result.analysis_type}</span>
                    <span className="result-time">
                      {new Date(result.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="result-query">{result.query}</h4>
                  <p className="result-location">{result.location}</p>
                  <button className="btn-view-inline">
                    View Results
                  </button>
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {rightPanelTab === 'log' && (
            <div className="log-container">
              <div className="log-header">
                <button
                  onClick={async () => {
                    try {
                      addLog('info', 'Fetching backend logs from Cloud Logging...');
                      const response = await fetch(`${GCP_BACKEND_URL}/api/logs?limit=50`);
                      if (!response.ok) throw new Error('Failed to fetch logs');

                      const data = await response.json();
                      if (data.success && data.logs) {
                        addLog('success', `Loaded ${data.count} backend logs`);
                        // Add backend logs to frontend logs
                        data.logs.forEach(backendLog => {
                          const timestamp = backendLog.timestamp ? new Date(backendLog.timestamp).toLocaleTimeString() : 'N/A';
                          const level = backendLog.severity ? backendLog.severity.toLowerCase() : 'info';
                          const message = `[Backend] ${backendLog.message}`;
                          setLogs(prev => [...prev, { timestamp, level, message }]);
                        });
                      } else {
                        addLog('warning', 'No backend logs available');
                      }
                    } catch (err) {
                      addLog('error', `Failed to load backend logs: ${err.message}`);
                    }
                  }}
                  className="btn btn-primary btn-small"
                >
                  Load Backend Logs
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="btn btn-secondary btn-small"
                >
                  Clear Logs
                </button>
              </div>
              <div className="log-content" ref={logContainerRef}>
                {logs.length === 0 ? (
                  <div className="log-empty">
                    <div className="empty-icon">📋</div>
                    <p>No logs yet. Start an analysis or load backend logs from Cloud Logging.</p>
                  </div>
                ) : (
                  <div className="log-entries">
                    {logs.map((log, index) => (
                      <div key={index} className={`log-entry log-${log.level}`}>
                        <span className="log-timestamp">{log.timestamp}</span>
                        <span className="log-level">{log.level}</span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MY ANALYSES PAGE - FIXED THUMBNAIL ====================
function MyAnalysesPage({ user, setShowAuthModal, setAuthView, setIsFullPageView }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      setAuthView('signup');
      return;
    }
    loadMyAnalyses();
  }, [user]);

  useEffect(() => {
    setIsFullPageView(!!selectedAnalysis);
  }, [selectedAnalysis, setIsFullPageView]);

  const loadMyAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (analysisId, currentShared) => {
    try {
      const { error } = await supabase
        .from('analyses')
        .update({ 
          is_shared: !currentShared,
          shared_at: !currentShared ? new Date().toISOString() : null
        })
        .eq('id', analysisId);

      if (error) throw error;
      alert(currentShared ? 'Analysis is now private' : 'Shared with community!');
      loadMyAnalyses();
    } catch (err) {
      alert('Failed to update sharing status');
    }
  };

  const handleDownload = async (sessionId) => {
    try {
      const response = await fetch(`${GCP_BACKEND_URL}/results/${sessionId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${sessionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download results: ' + err.message);
    }
  };

  // FIXED: Updated thumbnail URL construction
  const getThumbnailUrl = (item) => {
    // Priority 1: Check for thumbnail_url field (new backend format)
    if (item.thumbnail_url) {
      // If it's a full URL starting with http, use it directly
      if (item.thumbnail_url.startsWith('http')) {
        return item.thumbnail_url;
      }
      // If it starts with /, it's an API endpoint - prepend backend URL
      if (item.thumbnail_url.startsWith('/')) {
        return `${GCP_BACKEND_URL}${item.thumbnail_url}`;
      }
      // Otherwise use as-is (might be a relative path)
      return item.thumbnail_url;
    }
    
    // Priority 2: Check for chart_url (some analyses store it here)
    if (item.chart_url) {
      return item.chart_url;
    }
    
    // Priority 3: Construct from session_id using the CORRECT endpoint
    // FIXED: Changed from /thumbnail to /preview (matches backend)
    return `${GCP_BACKEND_URL}/results/${item.session_id}/preview`;
  };

  const getChartUrl = (item) => {
    if (item.chart_url) return item.chart_url;
    return `${GCP_BACKEND_URL}/results/${item.session_id}/chart`;
  };

  const getMapUrl = (item) => {
    if (item.map_url) return item.map_url;
    return `${GCP_BACKEND_URL}/results/${item.session_id}/map`;
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-text">Loading your analyses...</div>
      </div>
    );
  }

  if (selectedAnalysis) {
    return (
      <div className="page-container-full">
        <div className="viewer-header">
          <button 
            onClick={() => setSelectedAnalysis(null)} 
            className="btn btn-secondary"
          >
            ← Back to List
          </button>
          <h2>{selectedAnalysis.query}</h2>
          <div className="viewer-tabs">
            <button 
              onClick={() => setShowChart(false)}
              className={`viewer-tab ${!showChart ? 'active' : ''}`}
            >
              Map
            </button>
            <button 
              onClick={() => setShowChart(true)}
              className={`viewer-tab ${showChart ? 'active' : ''}`}
            >
              Charts
            </button>
          </div>
          <button
            onClick={() => handleDownload(selectedAnalysis.session_id)}
            className="btn btn-primary"
          >
            Download
          </button>
        </div>
        <div className="full-viewer">
          {!showChart ? (
            <iframe
              src={getMapUrl(selectedAnalysis)}
              className="full-iframe"
              title="Analysis Results"
            />
          ) : (
            <img
              src={getChartUrl(selectedAnalysis)}
              alt="Analysis Charts"
              className="full-chart-img"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Analyses</h1>
        <p>Manage and view all your satellite analysis results</p>
      </div>

      {analyses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No analyses yet</h3>
          <p>Start your first analysis from the home page!</p>
        </div>
      ) : (
        <div className="analysis-grid">
          {analyses.map((item) => (
            <div key={item.id} className="analysis-card">
              <div className={`card-badge ${item.is_shared ? 'community-badge' : 'private-badge'}`}>
                {item.is_shared ? 'Shared' : 'Private'}
              </div>
              
              <img 
                src={getThumbnailUrl(item)}
                alt={item.analysis_type}
                className="analysis-thumbnail"
                onError={(e) => {
                  console.error('Thumbnail failed to load:', getThumbnailUrl(item));
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.analysis-thumbnail-placeholder');
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
              <div className="analysis-thumbnail-placeholder" style={{ display: 'none' }}>
                🗺️
              </div>
              
              <div className="analysis-card-content">
                <h3>{item.analysis_type}</h3>
                <p className="analysis-query">{item.query}</p>
                <p className="analysis-location">📍 {item.location}</p>
                <p className="analysis-date">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                
                <div className="card-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnalysis(item);
                    }}
                    className="btn btn-primary btn-small"
                  >
                    View Results
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(item.id, item.is_shared);
                    }}
                    className="btn btn-secondary btn-small"
                  >
                    {item.is_shared ? 'Make Private' : 'Share'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== COMMUNITY PAGE - FIXED THUMBNAIL ====================
const ANALYSES_PER_PAGE = 20;

function CommunityPage({ setIsFullPageView, user }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [userLikes, setUserLikes] = useState(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadCommunityAnalyses(false);
    if (user) {
      loadUserLikes();
    }
  }, [user]);

  useEffect(() => {
    setIsFullPageView(!!selectedAnalysis);
  }, [selectedAnalysis, setIsFullPageView]);

  const loadCommunityAnalyses = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }

      const startIndex = loadMore ? (page + 1) * ANALYSES_PER_PAGE : 0;
      const endIndex = startIndex + ANALYSES_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('is_shared', true)
        .order('shared_at', { ascending: false })
        .range(startIndex, endIndex);

      if (error) throw error;

      // Check if we got a full page of results
      const receivedFullPage = data && data.length === ANALYSES_PER_PAGE;
      setHasMore(receivedFullPage);

      if (loadMore) {
        // Append new results to existing analyses
        setAnalyses(prev => [...prev, ...(data || [])]);
        setPage(prev => prev + 1);
      } else {
        // Replace all analyses (initial load)
        setAnalyses(data || []);
        setPage(0);
      }
    } catch (err) {
      console.error('Failed to load community analyses:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_likes')
        .select('analysis_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const likedAnalysisIds = new Set(data.map(item => item.analysis_id));
      setUserLikes(likedAnalysisIds);
    } catch (err) {
      console.error('Failed to load user likes:', err);
    }
  };

  // FIXED: Updated thumbnail URL construction (same as MyAnalysesPage)
  const getThumbnailUrl = (item) => {
    // Priority 1: Check for thumbnail_url field (new backend format)
    if (item.thumbnail_url) {
      // If it's a full URL starting with http, use it directly
      if (item.thumbnail_url.startsWith('http')) {
        return item.thumbnail_url;
      }
      // If it starts with /, it's an API endpoint - prepend backend URL
      if (item.thumbnail_url.startsWith('/')) {
        return `${GCP_BACKEND_URL}${item.thumbnail_url}`;
      }
      // Otherwise use as-is (might be a relative path)
      return item.thumbnail_url;
    }
    
    // Priority 2: Check for chart_url (some analyses store it here)
    if (item.chart_url) {
      return item.chart_url;
    }
    
    // Priority 3: Construct from session_id using the CORRECT endpoint
    // FIXED: Changed from /thumbnail to /preview (matches backend)
    return `${GCP_BACKEND_URL}/results/${item.session_id}/preview`;
  };

  const getChartUrl = (item) => {
    if (item.chart_url) return item.chart_url;
    return `${GCP_BACKEND_URL}/results/${item.session_id}/chart`;
  };

  const getMapUrl = (item) => {
    if (item.map_url) return item.map_url;
    return `${GCP_BACKEND_URL}/results/${item.session_id}/map`;
  };

  const handleLike = async (analysisId, currentLikes) => {
    if (!user) {
      alert('Please login to like analyses');
      return;
    }

    const isAlreadyLiked = userLikes.has(analysisId);

    try {
      if (isAlreadyLiked) {
        // Unlike: Remove like record
        const { error: unlikeError } = await supabase
          .from('analysis_likes')
          .delete()
          .eq('analysis_id', analysisId)
          .eq('user_id', user.id);

        if (unlikeError) throw unlikeError;

        // Decrease like count
        const newLikes = Math.max((currentLikes || 0) - 1, 0);
        const { error: updateError } = await supabase
          .from('analyses')
          .update({ likes: newLikes })
          .eq('id', analysisId);

        if (updateError) throw updateError;

        // Remove from local userLikes set
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(analysisId);
          return newSet;
        });
      } else {
        // Like: Insert like record
        const { error: likeError } = await supabase
          .from('analysis_likes')
          .insert([{
            analysis_id: analysisId,
            user_id: user.id,
            created_at: new Date().toISOString()
          }]);

        if (likeError) throw likeError;

        // Increase like count
        const newLikes = (currentLikes || 0) + 1;
        const { error: updateError } = await supabase
          .from('analyses')
          .update({ likes: newLikes })
          .eq('id', analysisId);

        if (updateError) throw updateError;

        // Add to local userLikes set
        setUserLikes(prev => new Set([...prev, analysisId]));
      }

      // Update the analysis in local state instead of reloading
      setAnalyses(prev => prev.map(analysis =>
        analysis.id === analysisId
          ? { ...analysis, likes: isAlreadyLiked ? Math.max((currentLikes || 0) - 1, 0) : (currentLikes || 0) + 1 }
          : analysis
      ));
    } catch (err) {
      console.error('Failed to toggle like:', err);
      alert('Failed to update like');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-text">Loading community research...</div>
      </div>
    );
  }

  if (selectedAnalysis) {
    return (
      <div className="page-container-full">
        <div className="viewer-header">
          <button 
            onClick={() => setSelectedAnalysis(null)} 
            className="btn btn-secondary"
          >
            ← Back to List
          </button>
          <h2>{selectedAnalysis.query}</h2>
          <div className="viewer-tabs">
            <button 
              onClick={() => setShowChart(false)}
              className={`viewer-tab ${!showChart ? 'active' : ''}`}
            >
              Map
            </button>
            <button 
              onClick={() => setShowChart(true)}
              className={`viewer-tab ${showChart ? 'active' : ''}`}
            >
              Charts
            </button>
          </div>
        </div>
        <div className="full-viewer">
          {!showChart ? (
            <iframe
              src={getMapUrl(selectedAnalysis)}
              className="full-iframe"
              title="Analysis Results"
            />
          ) : (
            <img
              src={getChartUrl(selectedAnalysis)}
              alt="Analysis Charts"
              className="full-chart-img"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Community Research</h1>
        <p>Explore analyses shared by the community</p>
      </div>

      {analyses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <h3>No shared analyses yet</h3>
          <p>Be the first to share your analysis with the community!</p>
        </div>
      ) : (
        <div className="analysis-grid">
          {analyses.map((item) => (
            <div key={item.id} className="analysis-card" onClick={() => setSelectedAnalysis(item)}>
              <div className="card-badge community-badge">Community</div>
              
              <img 
                src={getThumbnailUrl(item)}
                alt={item.analysis_type}
                className="analysis-thumbnail"
                onError={(e) => {
                  console.error('Thumbnail failed to load:', getThumbnailUrl(item));
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.analysis-thumbnail-placeholder');
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
              <div className="analysis-thumbnail-placeholder" style={{ display: 'none' }}>
                🗺️
              </div>
              
              <div className="analysis-card-content">
                <h3>{item.analysis_type}</h3>
                <p className="analysis-query">{item.query}</p>
                <p className="analysis-location">📍 {item.location}</p>
                <p className="analysis-author">
                  By: {item.user_email?.split('@')[0] || 'Anonymous'}
                </p>
                <p className="analysis-date">
                  {new Date(item.shared_at || item.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                
                <div className="card-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(item.id, item.likes);
                    }}
                    className={`btn btn-secondary btn-small like-btn ${userLikes.has(item.id) ? 'liked' : ''}`}
                    title={userLikes.has(item.id) ? "Click to unlike" : "Like this analysis"}
                  >
                    👍 {item.likes || 0}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnalysis(item);
                    }}
                    className="btn btn-primary btn-small"
                  >
                    View Results
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!loading && analyses.length > 0 && hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
          <button
            onClick={() => loadCommunityAnalyses(true)}
            disabled={loadingMore}
            className="btn btn-secondary btn-large"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Show total count */}
      {!loading && analyses.length > 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Showing {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
          {!hasMore && ' (all loaded)'}
        </div>
      )}
    </div>
  );
}

// ==================== ABOUT PAGE ====================
function AboutPage() {
  return (
    <div className="page-container">
      <div className="about-hero">
        <h1>About LLEO</h1>
        <p className="about-subtitle">Large Language Models for Earth Observation</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            LLEO combines the power of advanced AI with satellite imagery to make geospatial 
            analysis accessible to everyone. We believe that understanding our planet should 
            not require specialized expertise or expensive tools.
          </p>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>Vegetation Analysis</h3>
              <p>Track changes in vegetation using NDVI indices from Sentinel-2 imagery</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌫</div>
              <h3>Air Quality</h3>
              <p>Monitor air pollution levels with Sentinel-5P atmospheric data</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💧</div>
              <h3>Water Quality</h3>
              <p>Analyze water bodies for turbidity and chlorophyll levels</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Location Intelligence</h3>
              <p>Search and analyze businesses and points of interest</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌤</div>
              <h3>Weather Forecasting</h3>
              <p>Access detailed weather predictions and historical data</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered</h3>
              <p>Natural language queries powered by advanced language models</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Technology Stack</h2>
          <p>
            LLEO is built on cutting-edge technologies including Google Earth Engine for 
            satellite data processing, Vertex AI for natural language understanding, and 
            modern cloud infrastructure for reliable and scalable analysis.
          </p>
        </section>

        <section className="about-section">
          <h2>Get Started</h2>
          <p>
            Begin your Earth observation journey today. Upload your Google Earth Engine 
            credentials, ask a question in natural language, and let LLEO do the rest.
          </p>
        </section>
      </div>
    </div>
  );
}

// ==================== PRICING PAGE ====================
function PricingPage({ setCurrentPage }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Pricing</h1>
        <p>Choose the plan that fits your needs</p>
      </div>

      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-badge">Free</div>
          <h3>Starter</h3>
          <div className="price">
            <span className="price-amount">$0</span>
            <span className="price-period">/month</span>
          </div>
          <ul className="pricing-features">
            <li>20 credits on signup</li>
            <li>Basic satellite data</li>
            <li>Community sharing</li>
            <li>Email support</li>
          </ul>
          <button className="btn btn-secondary btn-large">Current Plan</button>
        </div>

        <div className="pricing-card featured">
          <div className="pricing-badge-featured">Popular</div>
          <h3>Professional</h3>
          <div className="price">
            <span className="price-amount">$1</span>
            <span className="price-period">/month</span>
          </div>
          <ul className="pricing-features">
            <li>100 credits per month</li>
            <li>Advanced satellite data</li>
            <li>Priority processing</li>
            <li>API access</li>
            <li>24/7 support</li>
          </ul>
          <button onClick={() => setCurrentPage('billing')} className="btn btn-primary btn-large">Upgrade Now</button>
        </div>

        <div className="pricing-card">
          <div className="pricing-badge">Enterprise</div>
          <h3>Enterprise</h3>
          <div className="price">
            <span className="price-amount">Custom</span>
          </div>
          <ul className="pricing-features">
            <li>Unlimited analyses</li>
            <li>All satellite data sources</li>
            <li>Dedicated infrastructure</li>
            <li>Custom integrations</li>
            <li>SLA guarantee</li>
            <li>Dedicated support</li>
          </ul>
          <button className="btn btn-secondary btn-large">Contact Sales</button>
        </div>
      </div>
    </div>
  );
}

// ==================== BILLING PAGE ====================
function BillingPage({ user, setShowAuthModal, setAuthView }) {
  const [credits, setCredits] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
      setAuthView('signup');
      return;
    }
    loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    try {
      // Load credits
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (creditError) throw creditError;
      setCredits(creditData);

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;
      setSubscription(subData);

      // Load recent transactions
      const { data: transData, error: transError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transError) throw transError;
      setTransactions(transData || []);

    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      // Call backend to create Stripe checkout session
      const formData = new FormData();
      formData.append('user_email', user.email);
      formData.append('user_id', user.id);

      const response = await fetch(`${GCP_BACKEND_URL}/api/billing/create-checkout-session`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error('Upgrade error:', err);
      alert(`Failed to start upgrade process: ${err.message}`);
    }
  };

  const handleManageSubscription = async () => {
    try {
      // Call backend to create Stripe Customer Portal session
      const formData = new FormData();
      formData.append('user_email', user.email);

      const response = await fetch(`${GCP_BACKEND_URL}/api/billing/create-portal-session`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404 || errorData.detail?.includes('Customer not found')) {
          throw new Error('No active subscription found. Please upgrade to Pro first.');
        }
        throw new Error(errorData.detail || 'Failed to create portal session');
      }

      const data = await response.json();

      // Redirect to Stripe Customer Portal
      window.location.href = data.portal_url;
    } catch (err) {
      console.error('Portal error:', err);
      alert(`Failed to open customer portal: ${err.message}`);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-text">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Billing & Credits</h1>
        <p>Manage your subscription and credit balance</p>
      </div>

      <div className="billing-grid">
        {/* Credit Balance Card */}
        <div className="billing-card">
          <div className="billing-card-header">
            <h3>Credit Balance</h3>
            <div className="credit-badge">
              {credits?.credits || 0} Credits
            </div>
          </div>
          <div className="billing-card-content">
            <div className="stat-row">
              <span className="stat-label">Total Used:</span>
              <span className="stat-value">{credits?.total_used || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value stat-highlight">{credits?.credits || 0}</span>
            </div>
            <p className="billing-note">Each analysis uses 1 credit</p>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="billing-card">
          <div className="billing-card-header">
            <h3>Current Plan</h3>
            <div className={`plan-badge plan-${subscription?.plan_type || 'free'}`}>
              {subscription?.plan_type?.toUpperCase() || 'FREE'}
            </div>
          </div>
          <div className="billing-card-content">
            <div className="stat-row">
              <span className="stat-label">Status:</span>
              <span className={`status-badge status-${subscription?.status || 'inactive'}`}>
                {subscription?.status || 'inactive'}
              </span>
            </div>
            {subscription?.plan_type === 'free' || !subscription?.stripe_customer_id ? (
              <>
                <p className="billing-description">
                  You're on the free plan with 20 initial credits.
                </p>
                <button onClick={handleUpgrade} className="btn btn-primary btn-large">
                  Upgrade to Pro - $1/month
                </button>
                <p className="billing-note">Get 100 credits per month</p>
              </>
            ) : (
              <>
                <p className="billing-description">
                  You have an active Pro subscription.
                </p>
                <button onClick={handleManageSubscription} className="btn btn-secondary btn-large">
                  Manage Subscription
                </button>
                <p className="billing-note" style={{marginTop: '10px', fontSize: '14px'}}>
                  Cancel subscription, update payment method, or view invoices
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="billing-section">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map((trans) => (
              <div key={trans.id} className="transaction-item">
                <div className="transaction-icon">
                  {trans.amount > 0 ? '+' : '-'}
                </div>
                <div className="transaction-details">
                  <div className="transaction-description">{trans.description}</div>
                  <div className="transaction-date">
                    {new Date(trans.created_at).toLocaleString()}
                  </div>
                </div>
                <div className={`transaction-amount ${trans.amount > 0 ? 'positive' : 'negative'}`}>
                  {trans.amount > 0 ? '+' : ''}{trans.amount}
                </div>
                <div className="transaction-balance">
                  Balance: {trans.balance_after}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div className="billing-section">
        <h2>Available Plans</h2>
        <div className="pricing-grid-simple">
          <div className="pricing-card-simple">
            <h3>Free</h3>
            <div className="price-simple">$0<span>/month</span></div>
            <ul>
              <li>20 credits on signup</li>
              <li>Basic satellite data</li>
              <li>Community sharing</li>
            </ul>
            <button className="btn btn-secondary btn-large" disabled>
              Current Plan
            </button>
          </div>

          <div className="pricing-card-simple featured-simple">
            <h3>Pro</h3>
            <div className="price-simple">$1<span>/month</span></div>
            <ul>
              <li>100 credits per month</li>
              <li>Advanced satellite data</li>
              <li>Priority processing</li>
              <li>API access</li>
            </ul>
            <button onClick={handleUpgrade} className="btn btn-primary btn-large">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== FOOTER ====================
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © 2025 LLEO. All rights reserved.
        </p>
        <div className="footer-links">
          <a href="mailto:contact@lleo.earth" className="footer-link">Contact Us</a>
          <span className="footer-separator">|</span>
          <a href="#" className="footer-link">Privacy Policy</a>
          <span className="footer-separator">|</span>
          <a href="#" className="footer-link">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

// ==================== AUTH MODAL ====================
function AuthModal({ authView, setAuthView, setShowAuthModal }) {
  return (
    <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
        
        {authView === 'login' && <LoginForm setAuthView={setAuthView} />}
        {authView === 'signup' && <SignupForm setAuthView={setAuthView} />}
        {authView === 'forgot' && <ForgotPasswordForm setAuthView={setAuthView} />}
      </div>
    </div>
  );
}

// ==================== LOGIN FORM ====================
function LoginForm({ setAuthView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Welcome Back!</h2>
      <p className="auth-subtitle">Sign in to continue analyzing</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-content">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
        <button onClick={handleSubmit} disabled={loading} className="btn btn-primary btn-large">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="form-links">
          <button onClick={() => setAuthView('forgot')} className="link-button">
            Forgot password?
          </button>
          <div>
            Don't have an account?{' '}
            <button onClick={() => setAuthView('signup')} className="link-button">
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SIGNUP FORM ====================
function SignupForm({ setAuthView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Send welcome email
      try {
        const formData = new FormData();
        formData.append('user_email', email);
        formData.append('credits', 20);

        await fetch(`${GCP_BACKEND_URL}/api/email/welcome`, {
          method: 'POST',
          body: formData
        });
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
        // Don't block signup if email fails
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-icon">✓</div>
        <h2>Check Your Email!</h2>
        <p>We've sent you a verification link.</p>
        <button onClick={() => setAuthView('login')} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <p className="auth-subtitle">Start analyzing satellite imagery</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-content">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
          minLength={6}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-input"
          required
        />
        <button onClick={handleSubmit} disabled={loading} className="btn btn-primary btn-large">
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <div className="form-links">
          Already have an account?{' '}
          <button onClick={() => setAuthView('login')} className="link-button">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== FORGOT PASSWORD ====================
function ForgotPasswordForm({ setAuthView }) {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-icon">✓</div>
        <h2>Email Sent!</h2>
        <p>Check your inbox for password reset instructions.</p>
        <button onClick={() => setAuthView('login')} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
      <p className="auth-subtitle">We'll send you a reset link</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-content">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <button onClick={handleSubmit} disabled={loading} className="btn btn-primary btn-large">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <button onClick={() => setAuthView('login')} className="btn btn-secondary">
          Back to Login
        </button>
      </div>
    </div>
  );
}