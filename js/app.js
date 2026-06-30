/* =============================================
   REELANCE — APP.JS
   Main application controller
   ============================================= */

function initApp() {
  const supabase = window.supabaseClient;
  let cachedCreators = [];
  // --- 1. Database Initialization ---
  // (Supabase auto-seeding is handled in loadCreators)

  const isBrowsePage = window.location.pathname.includes('creators');

  // --- 2. Core State ---
  const state = {
    activeCat: 'All',
    activeLoc: 'all',
    activeSort: 'newest',
    itemsShown: 8,
    selectedCreatorId: null
  };

  if (isBrowsePage) {
    const params = new URLSearchParams(window.location.search);
    state.activeCat = params.get('cat') || 'All';
    state.activeLoc = params.get('loc') || 'all';
  }
  let userCity = null;

  // --- 3. Run Page Initializations ---
  Auth.init();
  renderDynamicComponents();
  animatePlayhead();
  animateCounters();
  loadCreators();
  initScrollReveal();
  detectUserLocation();



  // --- 4. Event Listeners ---
  setupGlobalEvents();
  setupSearchEvents();
  setupFilterEvents();
  setupAuthEvents();
  setupMessagingEvents();

  /* ==========================================================================
     DATABASE HELPERS & GEOLOCATION
     ========================================================================== */
  async function detectUserLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data && data.city) {
          userCity = data.city;
          console.log("Detected user city:", userCity);
          UI.showToast(`Location detected: ${userCity}, ${data.country_name || 'IN'}`);
          if (state.activeLoc === 'local') {
            renderCreatorsList();
          }
          return;
        }
      }
    } catch (e) {
      console.warn("ipapi.co failed, trying geolocation-db fallback...", e);
    }

    try {
      const response2 = await fetch('https://geolocation-db.com/json/');
      if (response2.ok) {
        const data = await response2.json();
        if (data && data.city && data.city !== "Not Found") {
          userCity = data.city;
          console.log("Detected user city (fallback):", userCity);
          UI.showToast(`Location detected: ${userCity}`);
          if (state.activeLoc === 'local') {
            renderCreatorsList();
          }
        }
      }
    } catch (e) {
      console.warn("Fallback location detection failed:", e);
    }
  }

  function injectSkeletonStyles() {
    if (document.getElementById('skeleton-styles')) return;
    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.innerHTML = `
      @keyframes skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .skeleton-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 24px;
        height: 172px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .skeleton-line {
        background: linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%);
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.6s infinite linear;
        border-radius: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  function renderSkeleton() {
    injectSkeletonStyles();
    const grid = document.getElementById('creatorGrid');
    if (!grid) return;
    
    const count = isBrowsePage ? 8 : 4;
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div style="display:flex;gap:16px;align-items:center">
            <div class="skeleton-line" style="width:48px;height:48px;border-radius:50%"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px">
              <div class="skeleton-line" style="width:60%;height:16px"></div>
              <div class="skeleton-line" style="width:40%;height:12px"></div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px">
            <div class="skeleton-line" style="width:70px;height:24px;border-radius:99px"></div>
            <div class="skeleton-line" style="width:85px;height:24px;border-radius:99px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;border-top:1px solid rgba(255,255,255,0.05);padding-top:12px">
            <div class="skeleton-line" style="width:80px;height:20px"></div>
            <div class="skeleton-line" style="width:75px;height:28px;border-radius:8px"></div>
          </div>
        </div>
      `;
    }
    grid.innerHTML = html;
  }

  async function loadCreators() {
    // If no creators are loaded yet, render the shimmer skeleton instead of dummy data
    if (cachedCreators.length === 0) {
      renderSkeleton();
    } else {
      renderCreatorsList();
    }
    
    if (Auth.getState().isLoggedIn) {
      UI.unlockCreators();
    }

    try {
      const dbClient = window.supabaseAnonClient || window.supabaseClient || supabase;
      if (!dbClient) {
        if (cachedCreators.length === 0) {
          cachedCreators = window.REELANCE_DATA.creators || [];
          renderCreatorsList();
        }
        return;
      }

      // Race the Supabase query against a 5-second timeout
      const queryPromise = dbClient
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timed out after 5s')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) throw error;
      if (data && data.length > 0) {
        cachedCreators = data;
      } else {
        // Database is empty, use local fallback creators
        cachedCreators = window.REELANCE_DATA.creators || [];
      }
    } catch (e) {
      console.warn("loadCreators DB fetch failed, using fallback:", e.message || e);
      if (cachedCreators.length === 0 || cachedCreators === window.REELANCE_DATA.creators) {
        cachedCreators = window.REELANCE_DATA.creators || [];
      }
    }

    // Sync UI chips before re-rendering if on creators page
    if (isBrowsePage) {
      document.querySelectorAll('#filterChips .fchip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === state.activeCat);
      });
      document.querySelectorAll('#creatorLoc button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.loc === state.activeLoc);
      });
    }

    // Render the final list of real creators (or fallbacks if failed)
    renderCreatorsList();
    if (Auth.getState().isLoggedIn) {
      UI.unlockCreators();
    }
  }

  async function seedDatabaseIfEmpty() {
    // Seeding is disabled so only real registered creators appear in the database
    return;
  }

  function getCreatorsFromDB() {
    return cachedCreators;
  }

  async function checkConnectionRateLimit(clientId) {
    if (!supabase) return true;
    const session = Auth.getState();
    if (session.user && session.user.role === 'admin') {
      return true;
    }
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', clientId)
        .gte('created_at', oneHourAgo);

      if (error) {
        console.error("Error checking rate limit:", error);
        return true;
      }
      return count < 5;
    } catch (e) {
      console.error("Rate limit check failed:", e);
      return true;
    }
  }

  /* ==========================================================================
     DYNAMIC RENDERING
     ========================================================================== */
  function renderDynamicComponents() {
    // A. Render Categories
    const catGrid = document.getElementById('catGrid');
    if (catGrid) {
      catGrid.innerHTML = '';
      window.REELANCE_DATA.categories.forEach((cat, idx) => {
        const catCard = document.createElement('div');
        catCard.className = 'cat reveal in';
        catCard.innerHTML = `
          <div class="cat-ic">${cat.icon}</div>
          <span class="go">→</span>
          <h3>${cat.name}</h3>
          <span class="count">${cat.count} creators</span>
        `;
        catCard.addEventListener('click', () => {
          triggerCategoryFilter(cat.filter);
        });
        catGrid.appendChild(catCard);
      });
    }

    // B. Render Steps
    const stepsGrid = document.getElementById('stepsGrid');
    if (stepsGrid) {
      stepsGrid.innerHTML = '';
      window.REELANCE_DATA.steps.forEach(step => {
        const stepCard = document.createElement('div');
        stepCard.className = 'step reveal in';
        stepCard.innerHTML = `
          <span class="snum">${step.num}</span>
          <div class="sic">${step.icon}</div>
          <h3>${step.title}</h3>
          <p>${step.desc}</p>
          <div class="sbar"></div>
        `;
        stepsGrid.appendChild(stepCard);
      });
    }

    // C. Render Testimonials
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (testimonialsGrid) {
      testimonialsGrid.innerHTML = '';
      window.REELANCE_DATA.testimonials.forEach(t => {
        const testCard = document.createElement('div');
        testCard.className = 'ccard reveal in';
        testCard.style.padding = '24px';
        testCard.innerHTML = `
          <div style="display:flex;gap:4px;color:var(--orange);margin-bottom:12px">
            ${Array(t.rating).fill('<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>').join('')}
          </div>
          <p style="font-size:15px;color:var(--text);font-style:italic;margin-bottom:18px">"${t.quote}"</p>
          <div style="display:flex;align-items:center;gap:12px;border-top:1px solid var(--line);padding-top:14px">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg, ${t.grad[0]}, ${t.grad[1]});display:grid;place-items:center;font-weight:700;font-size:11px;color:#160d06;font-family:'Space Grotesk'">
              ${t.author.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div style="font-size:14px;font-weight:600">${t.author}</div>
              <div style="font-size:12px;color:var(--muted)">${t.role}</div>
            </div>
          </div>
        `;
        testimonialsGrid.appendChild(testCard);
      });
    }



    // Set Hero count
    const heroCount = document.getElementById('heroCreatorCount');
    if (heroCount) {
      heroCount.textContent = getCreatorsFromDB().filter(c => c.available !== false).length.toLocaleString('en-IN');
    }
  }

  function triggerCategoryFilter(category) {
    const isLoggedIn = Auth.getState().isLoggedIn;
    if (!isLoggedIn) {
      UI.showToast('Please log in to browse creative profiles.');
      UI.openModal('authBack');
      return;
    }
    if (!isBrowsePage) {
      window.location.href = `/creators.html?cat=${encodeURIComponent(category)}`;
      return;
    }
    state.activeCat = category;
    state.itemsShown = 8;
    // Highlight category chip
    document.querySelectorAll('.fchip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === category);
    });
    renderCreatorsList();
    scrollToSection('creators');
  }

  /* ==========================================================================
     CREATOR DIRECTORY LOGIC
     ========================================================================== */
  function renderCreatorsList() {
    const grid = document.getElementById('creatorGrid');
    const loadMoreWrap = document.getElementById('loadMoreWrap');
    if (!grid) return;

    const allCreators = getCreatorsFromDB().filter(c => c.available !== false);

    let filtered = [];
    let isFilteredByDetectedCity = false;
    let cityFallback = false;

    if (!isBrowsePage) {
      // On homepage: show exactly 8 newest creators
      filtered = [...allCreators];
      
      // Sort by newest
      filtered.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return (b.id || 0) - (a.id || 0);
      });

      // Slice to 8
      filtered = filtered.slice(0, 8);
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    } else {
      // Apply Filters on browse page
      filtered = allCreators.filter(c => {
        const matchCat = (state.activeCat === 'All' || c.cat === state.activeCat);
        
        let matchLoc = true;
        if (state.activeLoc !== 'all') {
          if (state.activeLoc === 'remote') {
            matchLoc = (c.loc === 'remote');
          } else if (state.activeLoc === 'local') {
            if (userCity) {
              matchLoc = c.city && c.city.toLowerCase().includes(userCity.toLowerCase());
              if (matchLoc) isFilteredByDetectedCity = true;
            } else {
              matchLoc = (c.loc === 'local');
            }
          }
        }
        return matchCat && matchLoc;
      });

      // Fallback: If no creators match the detected city, show any local creators with a notice
      if (state.activeLoc === 'local' && userCity && filtered.length === 0) {
        filtered = allCreators.filter(c => {
          const matchCat = (state.activeCat === 'All' || c.cat === state.activeCat);
          const matchLoc = (c.loc === 'local');
          return matchCat && matchLoc;
        });
        cityFallback = true;
      }

      // Apply Sorting on browse page
      filtered.sort((a, b) => {
        if (state.activeSort === 'rating') {
          return parseFloat(b.rating) - parseFloat(a.rating);
        } else if (state.activeSort === 'rate-low') {
          return parseRateValue(a.rate) - parseRateValue(b.rate);
        } else if (state.activeSort === 'rate-high') {
          return parseRateValue(b.rate) - parseRateValue(a.rate);
        } else if (state.activeSort === 'newest') {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return (b.id || 0) - (a.id || 0);
        }
        return 0;
      });
    }

    // Update Result Hint dynamically
    const hint = document.getElementById('resultHint');
    const isLoggedIn = Auth.getState().isLoggedIn;

    // Always unlock the grid if user is logged in (belt-and-suspenders)
    if (isLoggedIn) {
      UI.unlockCreators();
    }

    if (hint) {
      if (!isLoggedIn) {
        hint.textContent = 'log in to browse';
      } else if (!isBrowsePage) {
        hint.textContent = 'featured creators online now';
      } else if (state.activeLoc === 'local' && userCity && !cityFallback) {
        hint.textContent = `${filtered.length} ${filtered.length === 1 ? 'creator' : 'creators'} near ${userCity} online now`;
      } else {
        hint.textContent = `${filtered.length} ${filtered.length === 1 ? 'creator' : 'creators'} online now`;
      }
    }

    grid.innerHTML = '';
    
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty">// no creators match this filter combination. Try another category.</div>';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    if (isBrowsePage && state.activeLoc === 'local' && userCity && cityFallback && filtered.length > 0) {
      const notice = document.createElement('div');
      notice.className = 'empty';
      notice.style.padding = '12px';
      notice.style.fontSize = '12px';
      notice.style.color = 'var(--orange)';
      notice.innerHTML = `// no creators found directly in ${userCity} yet — showing other creators nearby instead.`;
      grid.appendChild(notice);
    }

    // Paginate items if on browse page
    const pageItems = isBrowsePage ? filtered.slice(0, state.itemsShown) : filtered;

    pageItems.forEach(c => {
      const initials = c.name.split(' ').map(n => n[0]).slice(0, 2).join('');
      const card = document.createElement('div');
      card.className = 'ccard';
      
      const verifiedBadge = c.verified ? `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--teal)" style="margin-left:4px;vertical-align:middle" aria-label="Verified">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ` : '';

      const currentUser = Auth.getState().user;
      const isSelf = currentUser && String(currentUser.id) === String(c.id);
      const buttonHTML = isSelf 
        ? `<button class="connect" data-id="${c.id}" disabled style="opacity:0.5; cursor:not-allowed">You</button>`
        : `<button class="connect" data-id="${c.id}">Connect</button>`;

      card.innerHTML = `
        <div class="ccard-top" style="cursor:pointer">
          <div class="avatar" style="background:linear-gradient(135deg, ${c.grad[0]}, ${c.grad[1]})">${initials}</div>
          <div style="flex:1">
            <h3 style="display:flex;align-items:center">${c.name} ${verifiedBadge}</h3>
            <div class="role">${c.role}</div>
          </div>
        </div>
        <div class="meta" style="flex:1; cursor:pointer">
          <span class="pill ${c.loc === 'remote' ? 'remote' : 'local'}">
            ${c.loc === 'remote' ? '◉ Remote' : '⚲ ' + (c.city ? c.city.split(',')[0] : 'Local')}
          </span>
          <span class="pill rating">★ ${c.rating} (${c.reviews || 0})</span>
        </div>
        <div class="foot">
          <span class="rate">${c.rate}<span>${c.per}</span></span>
          ${buttonHTML}
        </div>
      `;

      // Card header and meta clicks open profile details
      card.querySelector('.ccard-top').addEventListener('click', () => openProfileDetails(c.id));
      card.querySelector('.meta').addEventListener('click', () => openProfileDetails(c.id));
      
      // Connect button click
      card.querySelector('.connect').addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSelf) return;
        handleConnectClick(c.id);
      });

      grid.appendChild(card);
    });

    // Handle "Load more" visibility
    if (isBrowsePage && loadMoreWrap) {
      if (filtered.length > state.itemsShown && Auth.getState().isLoggedIn) {
        loadMoreWrap.style.display = 'block';
      } else {
        loadMoreWrap.style.display = 'none';
      }
    }
  }

  function parseRateValue(rateStr) {
    if (!rateStr) return 0;
    const clean = rateStr.replace(/[₹$,]/g, '').trim();
    return parseFloat(clean) || 0;
  }

  async function handleConnectClick(creatorId) {
    const isLoggedIn = Auth.getState().isLoggedIn;
    if (!isLoggedIn) {
      UI.showToast('Please log in to send message inquiries.');
      UI.openModal('authBack');
      return;
    }
    const currentUser = Auth.getState().user;
    if (currentUser && String(currentUser.id) === String(creatorId)) {
      UI.showToast('You cannot send message inquiries to yourself.');
      return;
    }

    // Check hourly connection rate limit (max 5)
    const allowed = await checkConnectionRateLimit(currentUser.id);
    if (!allowed) {
      UI.showToast('You have reached your limit of 5 connections per hour. Please try again later.');
      return;
    }

    const creators = getCreatorsFromDB();
    const creator = creators.find(c => String(c.id) === String(creatorId));
    if (!creator) return;

    state.selectedCreatorId = creatorId;
    document.getElementById('msgTitle').textContent = `Message ${creator.name}`;
    document.getElementById('msgSubject').value = '';
    document.getElementById('msgBody').value = '';
    UI.openModal('msgBack');
  }

  function openProfileDetails(creatorId) {
    const isLoggedIn = Auth.getState().isLoggedIn;
    if (!isLoggedIn) {
      UI.showToast('Please log in to view detailed creator portfolios.');
      UI.openModal('authBack');
      return;
    }
    const creators = getCreatorsFromDB();
    const creator = creators.find(c => String(c.id) === String(creatorId));
    if (!creator) return;

    state.selectedCreatorId = creatorId;
    const initials = creator.name.split(' ').map(n => n[0]).slice(0, 2).join('');
    const content = document.getElementById('profileContent');

    const verifiedBadge = creator.verified ? `
      <span style="background:rgba(52,224,204,0.12);color:var(--teal);font-size:11px;font-weight:700;font-family:'Space Mono';padding:4px 10px;border-radius:99px;display:inline-flex;align-items:center;gap:4px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        PORTFOLIO VERIFIED
      </span>
    ` : '';

    const skillsHTML = creator.skills && creator.skills.length > 0
      ? creator.skills.map(s => `<span class="pill rating" style="font-size:12px;padding:6px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--line)">${s}</span>`).join('')
      : '<span style="color:var(--muted-2)">No listed skills</span>';

    const currentUser = Auth.getState().user;
    const isSelf = currentUser && String(currentUser.id) === String(creatorId);
    const msgButtonHTML = isSelf 
      ? `<button class="btn btn-primary" id="profileMessageBtn" disabled style="flex:1;justify-content:center;opacity:0.5;cursor:not-allowed">
          Your Profile
         </button>`
      : `<button class="btn btn-primary" id="profileMessageBtn" style="flex:1;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
          Message ${creator.name.split(' ')[0]}
         </button>`;

    const showWaButton = !isSelf && creator.whatsapp && creator.whatsapp.trim().length > 0;
    const waButtonHTML = showWaButton
      ? `<button class="btn" id="profileWhatsappBtn" style="flex:1;justify-content:center;background:#25D366;color:white;border:none;display:inline-flex;align-items:center;gap:8px;font-weight:600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436.002 9.858-4.417 9.86-9.86.002-2.63-1.023-5.102-2.884-6.964-1.86-1.862-4.33-2.884-6.967-2.885-5.438 0-9.86 4.417-9.862 9.861-.001 1.67.452 3.3 1.309 4.745L1.047 22.9l4.8-1.258l.8-.488zM18.25 14.86c-.34-.17-2.01-.99-2.32-1.1-.31-.11-.53-.17-.75-.38-.22-.2-.55-.66-.99-1.1-.43-.44-.8-.92-1.15-1.1-.34-.17-.67-.14-.92.14-.25.28-.97 1.1-1.2 1.32-.22.22-.44.25-.78.08-.34-.17-1.42-.52-2.7-1.66C7.07 9.94 6.28 8.64 6 8.2c-.22-.44-.02-.67.14-.85.16-.16.34-.34.52-.52.18-.18.25-.3.38-.5.13-.2.06-.38-.03-.55-.09-.17-.75-1.8-.99-2.38-.25-.63-.52-.52-.72-.52h-.62c-.22 0-.58.08-.88.4-.3.32-1.15 1.12-1.15 2.72s1.16 3.16 1.32 3.38c.16.22 2.29 3.5 5.55 4.9 3.26 1.4 3.26.93 3.84.88.58-.05 2.01-.82 2.3-1.57.29-.75.29-1.38.2-1.52-.09-.13-.34-.2-.68-.37z"/></svg>
          WhatsApp
         </button>`
      : '';

    const showPortfolioButton = creator.portfolio && creator.portfolio.trim().length > 0;
    const portfolioButtonHTML = showPortfolioButton
      ? `<a href="${creator.portfolio}" target="_blank" rel="noopener noreferrer" class="btn" style="flex:1;justify-content:center;background:var(--panel-2);color:var(--text);border:1px solid var(--line-2);display:inline-flex;align-items:center;gap:8px;font-weight:600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          View Portfolio
         </a>`
      : '';

    const ratingSectionHTML = isSelf
      ? ''
      : `
        <div id="ratingSection" style="margin-bottom:28px;padding-top:20px;border-top:1px solid var(--line)">
          <h4 style="font-family:'Space Mono';font-size:11px;color:var(--muted-2);text-transform:uppercase;margin-bottom:10px">Rate this Creator</h4>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="star-rating" style="display:flex;gap:6px;font-size:24px;color:var(--muted-2);cursor:pointer">
              <span data-val="1" style="transition: color 0.2s;">☆</span>
              <span data-val="2" style="transition: color 0.2s;">☆</span>
              <span data-val="3" style="transition: color 0.2s;">☆</span>
              <span data-val="4" style="transition: color 0.2s;">☆</span>
              <span data-val="5" style="transition: color 0.2s;">☆</span>
            </div>
            <span id="ratingStatus" style="font-size:13px;color:var(--muted);margin-left:8px">Select stars to submit rating</span>
          </div>
        </div>
      `;

    content.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap">
        <div class="avatar" style="width:80px;height:80px;border-radius:20px;font-size:26px;background:linear-gradient(135deg, ${creator.grad[0]}, ${creator.grad[1]});flex-shrink:0">${initials}</div>
        <div style="flex:1;min-width:200px">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <h2 id="profileTitle" style="margin-top:0">${creator.name}</h2>
            ${verifiedBadge}
          </div>
          <p style="font-size:16px;color:var(--teal);font-weight:600;margin-top:4px">${creator.role}</p>
          <p style="color:var(--muted);font-size:14px;margin-top:4px">⚲ ${creator.city || 'Remote'} · Responds ${creator.responseTime || '< 2 hours'}</p>
        </div>
      </div>

      <div class="profile-stats-grid" style="display:grid;grid-template-columns:repeat(4, 1fr);gap:14px;margin:24px 0;background:var(--ink-2);border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center">
        <div>
          <div style="font-size:11px;color:var(--muted-2);font-family:'Space Mono'">RATING</div>
          <div id="modalRatingVal" style="font-size:18px;font-weight:700;color:var(--text);margin-top:4px">★ ${creator.rating}</div>
        </div>
        <div style="border-left:1px solid var(--line)">
          <div style="font-size:11px;color:var(--muted-2);font-family:'Space Mono'">EXPERIENCE</div>
          <div style="font-size:18px;font-weight:700;color:var(--text);margin-top:4px">${creator.experience || 0} Yrs</div>
        </div>
        <div style="border-left:1px solid var(--line)">
          <div style="font-size:11px;color:var(--muted-2);font-family:'Space Mono'">REVIEWS</div>
          <div id="modalCompletedVal" style="font-size:18px;font-weight:700;color:var(--text);margin-top:4px">${creator.reviews || 0} Reviews</div>
        </div>
        <div style="border-left:1px solid var(--line)">
          <div style="font-size:11px;color:var(--muted-2);font-family:'Space Mono'">BASE RATE</div>
          <div style="font-size:18px;font-weight:700;color:var(--orange);margin-top:4px">${creator.rate}${creator.per}</div>
        </div>
      </div>

      <div style="margin-bottom:24px">
        <h4 style="font-family:'Space Mono';font-size:11px;color:var(--muted-2);text-transform:uppercase;margin-bottom:8px">About</h4>
        <p style="font-size:15px;line-height:1.6;color:var(--muted)">${creator.bio || 'No bio provided.'}</p>
      </div>

      <div style="margin-bottom:28px">
        <h4 style="font-family:'Space Mono';font-size:11px;color:var(--muted-2);text-transform:uppercase;margin-bottom:10px">Skills & Tools</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${skillsHTML}</div>
      </div>

      ${ratingSectionHTML}

      <div style="display:flex;gap:12px;margin-top:32px;flex-wrap:wrap">
        ${portfolioButtonHTML}
        ${msgButtonHTML}
        ${waButtonHTML}
        <button class="btn btn-ghost" id="profileShareBtn" style="padding:13px 18px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        </button>
      </div>
    `;

    UI.openModal('profileBack');

    // Attach message click inside profile
    document.getElementById('profileMessageBtn').addEventListener('click', () => {
      if (isSelf) return;
      UI.closeModal('profileBack');
      setTimeout(() => {
        handleConnectClick(creatorId);
      }, 300);
    });

    if (showWaButton) {
      const waBtn = document.getElementById('profileWhatsappBtn');
      waBtn.addEventListener('click', async () => {
        if (isSelf) return;

        UI.setButtonLoading(waBtn, true, 'Connecting...');
        const user = Auth.getState().user;

        // 1. Check Rate Limit
        const allowed = await checkConnectionRateLimit(user.id);
        if (!allowed) {
          UI.setButtonLoading(waBtn, false, 'WhatsApp');
          UI.showToast('You have reached your limit of 5 connections per hour. Please try again later.');
          return;
        }

        // 2. Insert WhatsApp System message to DB
        if (supabase) {
          await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              sender_name: user.name,
              sender_email: user.email,
              recipient_id: String(creatorId),
              subject: 'WhatsApp Connection',
              body: '[System Notification] This client clicked your WhatsApp button to connect.'
            });
        }

        UI.setButtonLoading(waBtn, false, 'WhatsApp');

        // 3. Redirect to WhatsApp
        const cleanPhone = creator.whatsapp.replace(/[^0-9]/g, '');
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Hi, I found your profile on Reelance and would like to connect!')}`;
        window.open(waUrl, '_blank');
      });
    }

    document.getElementById('profileShareBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      UI.showToast('Profile link copied to clipboard!');
    });

    // Attach rating star interactions
    if (!isSelf) {
      const stars = document.querySelectorAll('.star-rating span');
      stars.forEach(star => {
        star.addEventListener('click', async () => {
          const val = parseInt(star.dataset.val);
          stars.forEach(s => {
            const sVal = parseInt(s.dataset.val);
            s.textContent = sVal <= val ? '★' : '☆';
            s.style.color = sVal <= val ? 'var(--orange)' : 'var(--muted-2)';
          });
          stars.forEach(s => s.style.pointerEvents = 'none');
          await submitRating(creatorId, val);
        });
        star.addEventListener('mouseover', () => {
          const val = parseInt(star.dataset.val);
          stars.forEach(s => {
            const sVal = parseInt(s.dataset.val);
            s.style.color = sVal <= val ? 'var(--orange)' : 'var(--muted-2)';
          });
        });
      });
    }
  }

  /* ==========================================================================
     TIMELINE & PLAYHEAD ANIMATION
     ========================================================================== */
  function animatePlayhead() {
    const playhead = document.getElementById('playhead');
    const track = document.getElementById('track');
    if (!playhead || !track) return;
    
    let left = 32; // Start matching CSS default
    let direction = 1;

    function step() {
      // Don't animate if window tab is blurred (performance optimization)
      if (document.hidden) {
        requestAnimationFrame(step);
        return;
      }
      
      left += 0.08 * direction;
      
      if (left >= 98) {
        direction = -1; // Reverse
      } else if (left <= 2) {
        direction = 1; // Go forward
      }

      playhead.style.left = left + '%';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ==========================================================================
     STATS NUM COUNTER ANIMATIONS
     ========================================================================== */
  function animateCounters() {
    const stats = document.querySelectorAll('.stat-num');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            UI.animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      stats.forEach(s => observer.observe(s));
    } else {
      // Fallback
      stats.forEach(s => UI.animateCount(s));
    }
  }

  /* ==========================================================================
     EVENT HANDLERS & LISTENERS
     ========================================================================== */
  function setupGlobalEvents() {
    // Mobile menu toggle
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (burger && mobileMenu) {
      burger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('open');
        mobileMenu.classList.toggle('open', !isOpen);
        burger.setAttribute('aria-expanded', !isOpen);
      });

      // Close mobile menu on clicking links
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Modal click out to close
    document.querySelectorAll('.modal-back').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          UI.closeModal(modal.id);
        }
      });
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-back.show');
        if (activeModal) UI.closeModal(activeModal.id);
      }
    });

    // Close buttons
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', () => UI.closeModal('authBack'));

    const profileClose = document.getElementById('profileClose');
    if (profileClose) profileClose.addEventListener('click', () => UI.closeModal('profileBack'));

    const msgClose = document.getElementById('msgClose');
    if (msgClose) msgClose.addEventListener('click', () => UI.closeModal('msgBack'));
  }

  function setupSearchEvents() {
    // Console remote vs local toggle
    const locButtons = document.querySelectorAll('#heroLoc button');
    locButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        locButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      });
    });

    // Quick Chips click
    const chips = document.querySelectorAll('#quickChips .chip-quick');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const category = chip.dataset.cat;
        if (!isBrowsePage) {
          const isLoggedIn = Auth.getState().isLoggedIn;
          if (!isLoggedIn) {
            UI.showToast('Please log in to browse creative profiles.');
            UI.openModal('authBack');
            return;
          }
          window.location.href = `/creators.html?cat=${encodeURIComponent(category)}`;
        } else {
          triggerCategoryFilter(category);
        }
      });
    });

    // Console search button
    const searchBtn = document.getElementById('heroSearchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const isLoggedIn = Auth.getState().isLoggedIn;
        if (!isLoggedIn) {
          UI.showToast('Please log in to browse creators.');
          UI.openModal('authBack');
          return;
        }

        const roleSelect = document.getElementById('roleSel');
        const activeLocBtn = document.querySelector('#heroLoc button.active');
        
        if (roleSelect && activeLocBtn) {
          const searchCat = roleSelect.value;
          const searchLoc = activeLocBtn.dataset.loc === 'remote' ? 'remote' : 'local';

          if (!isBrowsePage) {
            window.location.href = `/creators.html?cat=${encodeURIComponent(searchCat)}&loc=${encodeURIComponent(searchLoc)}`;
          } else {
            // Sync Homepage Filter State
            state.activeCat = searchCat;
            state.activeLoc = searchLoc === 'local' ? 'local' : 'remote'; // check if remote/local toggle matches
            state.itemsShown = 8;

            // Sync filters ui
            document.querySelectorAll('.fchip').forEach(btn => {
              btn.classList.toggle('active', btn.dataset.cat === searchCat);
            });
            
            document.querySelectorAll('#creatorLoc button').forEach(btn => {
              btn.classList.toggle('active', btn.dataset.loc === searchLoc);
            });

            renderCreatorsList();
            scrollToSection('creators');
            UI.showToast(`Search results loaded for ${searchCat} (${searchLoc})`);
          }
        }
      });
    }

    // Category links in footer
    const footLinks = document.querySelectorAll('footer a[data-filter]');
    footLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.dataset.filter;
        triggerCategoryFilter(cat);
      });
    });
  }

  function setupFilterEvents() {
    // Filter Category Chips
    const chips = document.querySelectorAll('#filterChips .fchip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        state.activeCat = chip.dataset.cat;
        state.itemsShown = 8;
        renderCreatorsList();
      });
    });

    // Filter Location Toggle
    const locBtns = document.querySelectorAll('#creatorLoc button');
    locBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        locBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.activeLoc = btn.dataset.loc;
        state.itemsShown = 8;
        renderCreatorsList();
      });
    });

    // Sort Select change
    const sortSel = document.getElementById('sortSelect');
    if (sortSel) {
      sortSel.addEventListener('change', (e) => {
        state.activeSort = e.target.value;
        renderCreatorsList();
      });
    }

    // Load More Button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        state.itemsShown += 8;
        renderCreatorsList();
      });
    }
  }

  function setupAuthEvents() {
    // Navigation items
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        Auth.setMode('login');
        openAuthModal();
      });
    }

    const joinBtn = document.getElementById('joinCreatorBtn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        Auth.setMode('signup');
        Auth.setRole('creator');
        openAuthModal();
      });
    }

    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', () => {
        Auth.setMode('signup');
        Auth.setRole('client');
        openAuthModal();
      });
    }

    // Lockwall sign up / log in
    const lockwallBtn = document.getElementById('lockwallSignupBtn');
    if (lockwallBtn) {
      lockwallBtn.addEventListener('click', () => {
        Auth.setMode('signup');
        Auth.setRole('client');
        openAuthModal();
      });
    }

    // Final CTA buttons
    const ctaFindBtn = document.getElementById('ctaFindBtn');
    if (ctaFindBtn) {
      ctaFindBtn.addEventListener('click', () => {
        const isLoggedIn = Auth.getState().isLoggedIn;
        if (isLoggedIn) {
          scrollToSection('creators');
        } else {
          Auth.setMode('signup');
          Auth.setRole('client');
          openAuthModal();
        }
      });
    }

    const ctaJoinBtn = document.getElementById('ctaJoinBtn');
    if (ctaJoinBtn) {
      ctaJoinBtn.addEventListener('click', () => {
        const isLoggedIn = Auth.getState().isLoggedIn;
        if (isLoggedIn) {
          window.location.href = 'dashboard';
        } else {
          Auth.setMode('signup');
          Auth.setRole('creator');
          openAuthModal();
        }
      });
    }

    // Mobile menu items
    const mobileJoinBtn = document.getElementById('mobileJoinBtn');
    if (mobileJoinBtn) {
      mobileJoinBtn.addEventListener('click', () => {
        Auth.setMode('signup');
        Auth.setRole('creator');
        openAuthModal();
      });
    }

    const mobileGetStartedBtn = document.getElementById('mobileGetStartedBtn');
    if (mobileGetStartedBtn) {
      mobileGetStartedBtn.addEventListener('click', () => {
        Auth.setMode('signup');
        Auth.setRole('client');
        openAuthModal();
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await Auth.logout();
        UI.resetNav();
        UI.lockCreators();
        state.itemsShown = 8;
        renderCreatorsList();
        UI.showToast('You have successfully logged out.');
        window.location.reload(); // Reload to clear states
      });
    }

    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', async () => {
        await Auth.logout();
        UI.resetNav();
        UI.lockCreators();
        state.itemsShown = 8;
        renderCreatorsList();
        UI.showToast('You have successfully logged out.');
        window.location.reload(); // Reload to clear states
      });
    }

    // Modal role segregation buttons
    const roleBtns = document.querySelectorAll('#roleSeg button');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Auth.setRole(btn.dataset.role);
      });
    });

    // Switch link mode (Login/Signup toggle)
    const switchToSignup = document.getElementById('switchToSignup');
    if (switchToSignup) {
      switchToSignup.addEventListener('click', () => {
        const currentMode = Auth.getState().mode;
        const nextMode = currentMode === 'login' ? 'signup' : 'login';
        Auth.setMode(nextMode);
        updateAuthModalUI();
      });
    }

    // Password visibility toggle
    const passToggle = document.getElementById('passToggle');
    const authPass = document.getElementById('authPass');
    if (passToggle && authPass) {
      passToggle.addEventListener('click', () => {
        const isPass = authPass.type === 'password';
        authPass.type = isPass ? 'text' : 'password';
        passToggle.innerHTML = isPass 
          ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` 
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });
    }

    // Forgot password click
    const forgotBtn = document.getElementById('forgotBtn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', async () => {
        const email = document.getElementById('authEmail').value.trim();
        if (!email) {
          UI.showError('Please enter your email address in the Email field first.');
          return;
        }
        if (!supabase) {
          UI.showError('Authentication service is offline. Please check your network connection.');
          return;
        }
        UI.hideError();
        forgotBtn.disabled = true;
        const originalText = forgotBtn.textContent;
        forgotBtn.textContent = 'Sending reset email...';
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/'
          });
          forgotBtn.disabled = false;
          forgotBtn.textContent = originalText;
          if (error) throw error;
          UI.showToast('Password reset link sent to your email.');
        } catch (e) {
          forgotBtn.disabled = false;
          forgotBtn.textContent = originalText;
          UI.showError(e.message);
        }
      });
    }

    // Google Auth click
    const googleBtn = document.getElementById('googleAuthBtn');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        UI.hideError();
        UI.setButtonLoading(googleBtn, true, 'Redirecting to Google...');
        
        try {
          const role = Auth.getState().role;
          await Auth.submitGoogle(role);
          // Browser will redirect to Google OAuth flow
        } catch (e) {
          UI.setButtonLoading(googleBtn, false, 'Continue with Google');
          UI.showError(e.message);
        }
      });
    }

    // Submit authentication
    const authSubmit = document.getElementById('authSubmit');
    if (authSubmit) {
      authSubmit.addEventListener('click', async () => {
        UI.hideError();
        
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPass').value;
        const name = document.getElementById('authName').value.trim();
        const stateData = Auth.getState();

        if (!email || !password) {
          UI.showError('Please fill in all email and password fields.');
          return;
        }

        UI.setButtonLoading(authSubmit, true, stateData.mode === 'login' ? 'Logging in...' : 'Registering...');

        try {
          let user;
          if (stateData.mode === 'signup') {
            if (!name) {
              UI.setButtonLoading(authSubmit, false);
              UI.showError('Full name is required for signup.');
              return;
            }
            user = await Auth.submitSignup(name, email, password, stateData.role);
          } else {
            user = await Auth.submitLogin(email, password, stateData.role);
          }

          if (user && user.confirmationRequired) {
            UI.setButtonLoading(authSubmit, false);
            const errEl = document.getElementById('formError');
            if (errEl) {
              errEl.style.display = 'block';
              errEl.style.background = 'rgba(52, 224, 204, 0.12)';
              errEl.style.color = 'var(--teal)';
              errEl.style.border = '1px solid rgba(52, 224, 204, 0.3)';
              errEl.style.padding = '12px';
              errEl.style.borderRadius = '8px';
              errEl.style.fontSize = '14px';
              errEl.style.lineHeight = '1.5';
              errEl.innerHTML = `<strong>Verify your email!</strong><br>We sent a confirmation link to <b>${user.email}</b>.<br>Please click the link in your inbox to confirm your account.`;
            }
            document.getElementById('authPass').value = '';
            return;
          }

          setTimeout(() => {
            UI.setButtonLoading(authSubmit, false);
            UI.updateNavForUser(user, stateData.role);
            UI.unlockCreators();
            renderCreatorsList();
            UI.closeModal('authBack');
            UI.showToast(`Welcome, ${user.name}!`);
            
            // Clear inputs
            document.getElementById('authEmail').value = '';
            document.getElementById('authPass').value = '';
            document.getElementById('authName').value = '';

            // Increment creators counter in hero
            const heroCount = document.getElementById('heroCreatorCount');
            if (heroCount) {
              heroCount.textContent = getCreatorsFromDB().filter(c => c.available !== false).length.toLocaleString('en-IN');
            }
          }, 300);

        } catch (err) {
          UI.setButtonLoading(authSubmit, false);
          UI.showError(err.message);
        }
      });
    }
  }

  function openAuthModal() {
    UI.hideError();
    updateAuthModalUI();
    UI.openModal('authBack');
  }

  function updateAuthModalUI() {
    const s = Auth.getState();
    const title = document.getElementById('authTitle');
    const sub = document.getElementById('authSub');
    const submit = document.getElementById('authSubmit');
    const toggle = document.getElementById('switchToSignup');
    const toggleContainer = document.getElementById('authToggle');
    const nameField = document.getElementById('signupNameField');
    const forgotWrap = document.getElementById('forgotWrap');

    // Sync role buttons in modal
    document.querySelectorAll('#roleSeg button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === s.role);
    });

    if (s.mode === 'signup') {
      title.textContent = 'Create your free account';
      sub.textContent = 'Sign up to browse creators and start a project.';
      submit.textContent = 'Create account — free';
      nameField.style.display = 'block';
      forgotWrap.style.display = 'none';
      if (toggleContainer) {
        toggleContainer.innerHTML = `Already a member? <button id="switchToSignup" style="background:none;border:none;color:var(--teal);font-weight:600;cursor:pointer">Log in</button>`;
      }
    } else {
      title.textContent = 'Welcome back';
      sub.textContent = 'Log in to browse creators and start a project.';
      submit.textContent = 'Log in';
      nameField.style.display = 'none';
      forgotWrap.style.display = 'flex';
      if (toggleContainer) {
        toggleContainer.innerHTML = `New to Reelance? <button id="switchToSignup" style="background:none;border:none;color:var(--teal);font-weight:600;cursor:pointer">Create a free account</button>`;
      }
    }

    // Rebind listener since innerHTML swap destroys child element reference
    const newToggle = document.getElementById('switchToSignup');
    if (newToggle) {
      newToggle.addEventListener('click', () => {
        Auth.setMode(s.mode === 'login' ? 'signup' : 'login');
        updateAuthModalUI();
      });
    }
  }

  function setupMessagingEvents() {
    const sendBtn = document.getElementById('msgSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        if (sendBtn.disabled) return;
        const subject = document.getElementById('msgSubject').value.trim();
        const body = document.getElementById('msgBody').value.trim();

        if (!subject || !body) {
          UI.showToast('Please fill in the project title and message.');
          return;
        }

        UI.setButtonLoading(sendBtn, true, 'Sending...');

        if (!supabase) {
          UI.showToast('Messaging service is offline. Please check your network connection.');
          UI.setButtonLoading(sendBtn, false, 'Send message');
          return;
        }

        const user = Auth.getState().user;

        // Rate limit check
        const allowed = await checkConnectionRateLimit(user.id);
        if (!allowed) {
          UI.setButtonLoading(sendBtn, false, 'Send message');
          UI.showToast('You have reached your limit of 5 connections per hour. Please try again later.');
          return;
        }

        supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            sender_name: user.name,
            sender_email: user.email,
            recipient_id: String(state.selectedCreatorId),
            subject: subject,
            body: body
          })
          .then(({ error }) => {
            UI.setButtonLoading(sendBtn, false, 'Send message');
            if (error) {
              UI.showToast('Failed to send message: ' + error.message);
              console.error(error);
            } else {
              UI.closeModal('msgBack');
              UI.showToast('Your message has been sent successfully!');
              // Reset fields
              document.getElementById('msgSubject').value = '';
              document.getElementById('msgBody').value = '';
            }
          });
      });
    }
  }

  /* ==========================================================================
     UTILITIES
     ========================================================================== */
  function initScrollReveal() {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      document.querySelectorAll('.reveal').forEach((el, idx) => {
        el.style.transitionDelay = (idx % 5 * 0.05) + 's';
        io.observe(el);
      });
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    }
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90; // Header height safety spacing
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }

  // Expose openAuth globally for inline onclick handlers
  window.openAuth = (mode, role) => {
    if (mode) Auth.setMode(mode);
    if (role) Auth.setRole(role);
    openAuthModal();
  };

  // Expose updates globally
  window.renderCreatorsList = renderCreatorsList;
  window.loadCreators = loadCreators;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
