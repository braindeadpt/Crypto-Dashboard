/** Theme bootstrap — shared by server layout script and client toggle. */
export const THEME_STORAGE_KEY = "clareza-theme";

/**
 * Blocking inline script for <head> — prevents FOUC.
 * Order: localStorage override → prefers-color-scheme → dark.
 *
 * Dark is the signature theme and the fallback: this is a live market
 * instrument, and the luminous palette is the product's identity.
 */
export const themeBootstrapScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
