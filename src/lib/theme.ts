/** Theme bootstrap — shared by server layout script and client toggle. */
export const THEME_STORAGE_KEY = "clareza-theme";

/**
 * Blocking inline script for <head> — prevents FOUC.
 * Order: localStorage override → Noite (dark).
 *
 * Noite is the default since V4: light-in-motion needs a dark ground to be
 * seen — the Corrente read washed-out over paper. Papel stays one click
 * away as the editorial theme.
 */
export const themeBootstrapScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
