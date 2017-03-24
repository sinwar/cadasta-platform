var map = L.map('mapid');
var sr = new SimpleRouter(map);
sr.router();
window.addEventListener('hashchange', function() {
    sr.router();
});
window.addEventListener('load', function() {
    sr.router();
});
SMap(map);
var hash = new L.Hash(map);
