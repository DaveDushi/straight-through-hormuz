let deferredPrompt = null;
let updateReady = false;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    updateReady = true;
                }
            });
        });
    });
}

export function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || navigator.standalone === true;
}

export function hasUpdate() {
    return updateReady;
}

export function applyUpdate() {
    if (updateReady) window.location.reload();
}

export function canPromptInstall() {
    return deferredPrompt !== null;
}

export async function promptInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
}
