// Always the latest build (DEPLOY-01). The built scripts and styles have hashed
// names, so only the page itself can go stale: GitHub Pages lets browsers keep it
// for a while, and phones keep it longer. On load, ask the server (past every
// cache) which build is live; if it is not this one, load the page again under a
// new address, which no cache has seen. Once per build, so it can never loop.

const PARAM = 'v';

export function stayFresh() {
  if (!import.meta.env.PROD) return;
  const url = new URL(window.location.href);
  const arrivedFor = url.searchParams.get(PARAM);
  // arrived from a refresh: tidy the address back to what the visitor typed
  if (arrivedFor) {
    url.searchParams.delete(PARAM);
    window.history.replaceState(null, '', url);
  }
  fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((live) => {
      if (!live?.id || live.id === __BUILD_ID__) return;
      if (arrivedFor === live.id || readOnce() === live.id) return;
      writeOnce(live.id);
      url.searchParams.set(PARAM, live.id);
      window.location.replace(url);
    })
    .catch(() => {}); // offline or blocked: the page in hand still works
}

function readOnce() {
  try {
    return sessionStorage.getItem('fresh-build');
  } catch {
    return null;
  }
}
function writeOnce(id) {
  try {
    sessionStorage.setItem('fresh-build', id);
  } catch {
    // no storage: `arrivedFor` still stops a second refresh for the same build
  }
}
