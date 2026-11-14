/**
 * urlState.ts
 * Manages URL query parameter synchronization so users, teachers, and researchers
 * can bookmark or share an exact historical moment or configuration.
 */

export interface AppUrlState {
  year?: number;
  speed?: 'slow' | 'normal' | 'fast';
  mode?: 'jukebox' | 'classroom' | 'birthyear';
}

/** Parse current URL search params */
export function getUrlState(): AppUrlState {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const state: AppUrlState = {};

  const yearStr = params.get('year');
  if (yearStr) {
    const y = parseInt(yearStr, 10);
    if (!isNaN(y) && y >= 1880 && y <= 2025) {
      state.year = y;
    }
  }

  const speedStr = params.get('speed');
  if (speedStr === 'slow' || speedStr === 'normal' || speedStr === 'fast') {
    state.speed = speedStr;
  }

  const modeStr = params.get('mode');
  if (modeStr === 'jukebox' || modeStr === 'classroom' || modeStr === 'birthyear') {
    state.mode = modeStr;
  }

  return state;
}

/** Update URL search params without page reload */
export function setUrlState(state: AppUrlState): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);

  if (state.year !== undefined) url.searchParams.set('year', state.year.toString());
  if (state.speed !== undefined) url.searchParams.set('speed', state.speed);
  if (state.mode !== undefined && state.mode !== 'jukebox') {
    url.searchParams.set('mode', state.mode);
  } else {
    url.searchParams.delete('mode');
  }

  window.history.replaceState({}, '', url.toString());
}

/** Copy current shareable link to clipboard */
export async function copyShareableLink(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
