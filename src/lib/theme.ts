/** Theme bootstrap — shared by server layout script and client toggle. */
export const THEME_STORAGE_KEY = "clareza-theme";

/**
 * Blocking inline script for <head> — prevents FOUC.
 * Order: localStorage override → prefers-color-scheme → light.
 */
export const themeBootstrapScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
