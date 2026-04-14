export function track(event, params) {
    if (typeof gtag === 'function') {
        gtag('event', event, params);
    }
}
