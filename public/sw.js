self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if(event.data.type === 'MOSTRA_NOTIFICA') {
        self.registration.showNotification(event.data.titolo, event.data.opzioni);
    }
});