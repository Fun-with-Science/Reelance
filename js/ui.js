/* =============================================
   REELANCE — UI.JS
   UI update functions
   ============================================= */

const UI = (() => {

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), duration);
  }

  // --- Loading state for buttons ---
  function setButtonLoading(btn, loading, originalText) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Please wait...
      </span>`;
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || originalText || 'Submit';
    }
  }

  // --- Show/hide form error ---
  function showError(msg) {
    const el = document.getElementById('formError');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hideError() {
    const el = document.getElementById('formError');
    if (el) el.style.display = 'none';
  }

  // --- Update nav after login ---
  function updateNavForUser(user, role) {
    const navCta = document.getElementById('navCta');
    const navUser = document.getElementById('navUser');
    const uname = document.getElementById('uname');
    const uava = document.getElementById('uava');
    const uroleBadge = document.getElementById('uroleBadge');

    if (!navCta || !navUser) return;

    navCta.style.display = 'none';
    navUser.style.display = 'flex';

    const displayName = (user && user.name) ? user.name : (user && user.email ? user.email.split('@')[0] : 'You');
    const initial = (displayName && displayName[0] || 'U').toUpperCase();

    if (uname) uname.textContent = displayName ? displayName.split(' ')[0] : 'You';
    if (uava) {
      // Apply clean role placeholder class
      uava.className = 'uava';
      uava.classList.add(`role-${role || 'client'}`);

      if (user && user.avatar) {
        uava.innerHTML = `<img src="${user.avatar}" alt="${displayName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" />`;
        uava.style.background = 'transparent';
      } else {
        uava.textContent = initial;
        uava.style.background = '';
        uava.style.color = '';
      }
    }
    if (uroleBadge) {
      if (role === 'admin') {
        uroleBadge.textContent = 'Admin';
        uroleBadge.style.background = 'rgba(168, 85, 247, 0.12)';
        uroleBadge.style.color = '#a855f7';
      } else if (role === 'creator') {
        uroleBadge.textContent = 'Creator';
        uroleBadge.style.background = 'rgba(52,224,204,0.12)';
        uroleBadge.style.color = 'var(--teal)';
      } else {
        uroleBadge.textContent = 'Client';
        uroleBadge.style.background = 'rgba(255,123,61,0.12)';
        uroleBadge.style.color = 'var(--orange)';
      }
    }

    // Toggle Mobile Menu Buttons
    const mJoin = document.getElementById('mobileJoinBtn');
    const mGetStarted = document.getElementById('mobileGetStartedBtn');
    const mDash = document.getElementById('mobileDashBtn');
    const mLogout = document.getElementById('mobileLogoutBtn');
    if (mJoin) mJoin.style.display = 'none';
    if (mGetStarted) mGetStarted.style.display = 'none';
    if (mDash) mDash.style.display = 'flex';
    if (mLogout) mLogout.style.display = 'flex';
  }

  function resetNav() {
    const navCta = document.getElementById('navCta');
    const navUser = document.getElementById('navUser');
    if (navCta) navCta.style.display = 'flex';
    if (navUser) navUser.style.display = 'none';

    // Toggle Mobile Menu Buttons back
    const mJoin = document.getElementById('mobileJoinBtn');
    const mGetStarted = document.getElementById('mobileGetStartedBtn');
    const mDash = document.getElementById('mobileDashBtn');
    const mLogout = document.getElementById('mobileLogoutBtn');
    if (mJoin) mJoin.style.display = 'flex';
    if (mGetStarted) mGetStarted.style.display = 'flex';
    if (mDash) mDash.style.display = 'none';
    if (mLogout) mLogout.style.display = 'none';
  }

  // --- Unlock/lock creator grid ---
  function unlockCreators() {
    const wrap = document.getElementById('creatorsWrap');
    const filters = document.getElementById('filters');
    const loadMore = document.getElementById('loadMoreWrap');
    const hint = document.getElementById('resultHint');
    if (wrap) wrap.classList.remove('locked');
    if (filters) filters.classList.remove('hidden');
    if (loadMore) loadMore.style.display = 'block';
    if (hint) hint.textContent = 'browse creators';
  }

  function lockCreators() {
    const wrap = document.getElementById('creatorsWrap');
    const filters = document.getElementById('filters');
    const loadMore = document.getElementById('loadMoreWrap');
    const hint = document.getElementById('resultHint');
    if (wrap) wrap.classList.add('locked');
    if (filters) filters.classList.add('hidden');
    if (loadMore) loadMore.style.display = 'none';
    if (hint) hint.textContent = 'log in to browse';
  }

  // --- Update result hint ---
  function updateHint(count) {
    const hint = document.getElementById('resultHint');
    if (hint) hint.textContent = count + (count === 1 ? ' creator' : ' creators') + ' online now';
  }

  // --- Modal helpers ---
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'flex';
    // Force reflow for animation
    el.offsetHeight;
    el.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('show');
    setTimeout(() => {
      if (!el.classList.contains('show')) {
        el.style.display = 'none';
      }
    }, 280);
    document.body.style.overflow = '';
  }

  // --- Animate counting numbers ---
  function animateCount(el) {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      const current = Math.floor(ease * target);

      if (target >= 1000) {
        el.textContent = current.toLocaleString('en-IN') + suffix;
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString('en-IN') + suffix;
    }

    requestAnimationFrame(update);
  }

  return {
    showToast,
    setButtonLoading,
    showError,
    hideError,
    updateNavForUser,
    resetNav,
    unlockCreators,
    lockCreators,
    updateHint,
    openModal,
    closeModal,
    animateCount
  };
})();

window.UI = UI;
