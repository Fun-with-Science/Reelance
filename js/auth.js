/* =============================================
   REELANCE — AUTH.JS
   Production-ready integration with Supabase Auth
   ============================================= */

// Initialize Supabase Client Safely
const SUPABASE_URL = 'https://xfgpsojwqvrhznljoxgn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XfkI8bJIU3eMaCfIxcnSPQ_QePN0lUQ';

if (window.supabase && !window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  window.supabaseAnonClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false
    }
  });
} else if (!window.supabase) {
  console.warn("Supabase library not loaded. Running in local fallback mode.");
}

const Auth = (() => {
  const supabase = window.supabaseClient;
  // --- State ---
  let state = {
    isLoggedIn: false,
    user: null,
    role: 'client',
    mode: 'login'  // 'login' | 'signup'
  };

  // --- Persist session in localStorage ---
  function saveSession() {
    localStorage.setItem('rl_session', JSON.stringify(state));
  }

  function loadSession() {
    try {
      const s = localStorage.getItem('rl_session');
      if (s) {
        state = JSON.parse(s);
        return true;
      }
    } catch (e) {
      console.error('Session load error:', e);
    }
    return false;
  }

  // --- Public API ---
  async function init() {
    // 1. First restore session from localStorage if present (for speed)
    const restored = loadSession();
    if (restored && state.isLoggedIn) {
      UI.updateNavForUser(state.user, state.role);
      UI.unlockCreators();
    }

    if (!supabase) {
      console.warn("Supabase is not initialized. Skipping session sync.");
      return;
    }

    // 2. Fetch active session from Supabase to sync state & listen to changes
    try {
      // Listen for auth events (like when redirecting back from email confirmation link)
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          await syncUserSession(session);
        } else if (event === 'SIGNED_OUT') {
          if (state.isLoggedIn) {
            await logout();
            UI.resetNav();
            UI.lockCreators();
            if (window.loadCreators) {
              window.loadCreators();
            }
          }
        }
      });

      // Run an initial check for active session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && session.user) {
        await syncUserSession(session);
      } else {
        if (state.isLoggedIn) {
          await logout();
          UI.resetNav();
          UI.lockCreators();
        }
      }
    } catch (e) {
      console.error('Supabase session initialization failed:', e);
    }
  }

  async function syncUserSession(session) {
    try {
      let profile = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (!error) profile = data;
      } catch (e) {
        console.warn("Profiles query failed, falling back to auth metadata:", e);
      }

      if (profile) {
        if (profile.is_banned) {
          const untilDate = profile.banned_until ? new Date(profile.banned_until) : null;
          if (!untilDate || untilDate > new Date()) {
            const dateStr = untilDate ? untilDate.toLocaleDateString() : 'indefinitely';
            await logout();
            alert(`Your account has been suspended until ${dateStr}. Reason: ${profile.ban_reason || 'Policy violation'}`);
            window.location.href = 'contact';
            return;
          } else {
            await supabase.from('profiles').update({ is_banned: false, banned_until: null, ban_reason: null }).eq('id', profile.id);
          }
        }

        state.isLoggedIn = true;
        state.user = {
          id: session.user.id,
          email: session.user.email,
          name: profile.name,
          role: profile.role,
          avatar: session.user.user_metadata?.avatar_url || null,
          createdAt: session.user.created_at
        };
        state.role = profile.role;
        saveSession();
        UI.updateNavForUser(state.user, state.role);
        UI.unlockCreators();
        
        if (window.loadCreators) {
          window.loadCreators();
        } else if (window.renderCreatorsList) {
          window.renderCreatorsList();
        }
      } else {
        // Recovery: Recreate profile from auth user metadata if missing/unreadable!
        const finalRole = session.user.user_metadata?.role || 'client';
        const name = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
        
        // Attempt background insert, ignoring failures if it already exists
        supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            name: name,
            email: session.user.email,
            role: finalRole
          })
          .then(async ({ error }) => {
            if (error) {
              console.warn("Failed to auto-insert profile (it may already exist):", error);
            }
            if (finalRole === 'creator') {
              try {
                const { data: creatorExists } = await supabase
                  .from('creators')
                  .select('id')
                  .eq('id', session.user.id)
                  .single();
                
                if (!creatorExists) {
                  await supabase.from('creators').insert({
                    id: session.user.id,
                    name: name,
                    role: 'Video Editor · Freelance',
                    cat: 'Video Editor',
                    loc: 'remote',
                    city: 'Remote',
                    rate: '$35',
                    per: '/hr',
                    rating: 0.0,
                    reviews: 0,
                    experience: 0,
                    grad: ["#34E0CC", "#5fe9d9"],
                    verified: false,
                    bio: 'Welcome to my creator portfolio! Click "Edit Profile" in your dashboard to customize your bio, skills, location, and rates.',
                    skills: ['Video Editor'],
                    completed_jobs: 0,
                    response_time: '< 1 hr',
                    available: true
                  });
                }
              } catch (err) {
                console.warn("Failed to auto-check or insert creator profile:", err);
              }
            }
          });

        state.isLoggedIn = true;
        state.user = {
          id: session.user.id,
          email: session.user.email,
          name: name,
          role: finalRole,
          avatar: session.user.user_metadata?.avatar_url || null,
          createdAt: session.user.created_at
        };
        state.role = finalRole;
        saveSession();
        UI.updateNavForUser(state.user, state.role);
        UI.unlockCreators();
        
        if (window.loadCreators) {
          window.loadCreators();
        } else if (window.renderCreatorsList) {
          window.renderCreatorsList();
        }
      }
    } catch (err) {
      console.error("Error syncing user session:", err);
    }
  }

  function getState() { return state; }
  function setRole(role) { state.role = role; }
  function setMode(mode) { state.mode = mode; }

  async function submitLogin(email, password, role) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch user profile
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pError || !profile) {
      await supabase.auth.signOut();
      throw new Error("Could not find user profile in the database. Please sign up first.");
    }

    // Check for active ban
    if (profile.is_banned) {
      const untilDate = profile.banned_until ? new Date(profile.banned_until) : null;
      if (!untilDate || untilDate > new Date()) {
        const dateStr = untilDate ? untilDate.toLocaleDateString() : 'indefinitely';
        await supabase.auth.signOut();
        throw new Error(`Your account has been suspended until ${dateStr}. Reason: ${profile.ban_reason || 'Policy violation'}`);
      } else {
        await supabase.from('profiles').update({ is_banned: false, banned_until: null, ban_reason: null }).eq('id', profile.id);
      }
    }

    // Validate matching role
    if (profile.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`This account is registered as a ${profile.role === 'creator' ? 'Creator' : 'Client'}. Please switch tabs.`);
    }

    state.isLoggedIn = true;
    state.user = {
      id: data.user.id,
      email: data.user.email,
      name: profile.name,
      role: profile.role,
      avatar: null,
      createdAt: data.user.created_at
    };
    state.role = role;
    saveSession();
    return state.user;
  }

  async function submitSignup(name, email, password, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role
        }
      }
    });
    if (error) throw error;

    if (!data.user) {
      throw new Error("Signup failed. Please verify if your email is formatted correctly.");
    }

    // Insert public profile details
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role
      });

    if (profileError) {
      console.error('Profile insertion failed:', profileError);
      throw profileError;
    }

    // If signing up as a creator, add to the creators database table
    if (role === 'creator') {
      const creatorRoles = ['Video Editor', 'Animation', 'Motion Graphics', 'VFX', 'Colorist', 'Thumbnail', 'Sound'];
      const randomRole = creatorRoles[Math.floor(Math.random() * creatorRoles.length)];
      const gradients = [
        ["#FF7B3D", "#ff9d57"],
        ["#34E0CC", "#5fe9d9"],
        ["#FF7B3D", "#ff6b2c"],
        ["#34E0CC", "#2fd8c4"],
        ["#ff9d57", "#FF7B3D"],
        ["#5fe9d9", "#34E0CC"]
      ];
      const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

      const { error: creatorError } = await supabase
        .from('creators')
        .insert({
          id: data.user.id,
          name: name.trim(),
          role: randomRole + ' · Freelance',
          cat: randomRole,
          loc: 'remote',
          city: 'Remote',
          rate: '$35',
          per: '/hr',
          rating: 0.0,
          reviews: 0,
          experience: 0,
          grad: randomGrad,
          verified: false,
          bio: 'Welcome to my creator portfolio! Click "Edit Profile" in your dashboard to customize your bio, skills, location, and rates.',
          skills: [randomRole, 'Editing'],
          completed_jobs: 0,
          response_time: '< 1 hr',
          available: true
        });

      if (creatorError) {
        console.error('Creator profile insertion failed:', creatorError);
        throw creatorError;
      }
    }

    if (!data.session) {
      // User registered, but email confirmation is active
      return { confirmationRequired: true, email: data.user.email };
    }

    state.isLoggedIn = true;
    state.user = {
      id: data.user.id,
      email: data.user.email,
      name: name,
      role: role,
      avatar: null,
      createdAt: data.user.created_at
    };
    state.role = role;
    saveSession();
    return state.user;
  }

  async function submitGoogle(role) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard?role=' + role
      }
    });
    if (error) throw error;
    return data;
  }

  async function logout() {
    state = { isLoggedIn: false, user: null, role: 'client', mode: 'login' };
    localStorage.removeItem('rl_session');
    try {
      await supabase.auth.signOut();
    } catch(e) {}
  }

  return { init, getState, setRole, setMode, submitLogin, submitSignup, submitGoogle, logout };
})();

window.Auth = Auth;
