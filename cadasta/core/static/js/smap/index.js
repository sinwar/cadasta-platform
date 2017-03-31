var map = L.map('mapid');
var sr = new SimpleRouter(map);
sr.router();

/*****************
EVENT LISTENERS
*****************/
window.addEventListener('hashchange', function() {
    sr.router();
});
window.addEventListener('load', function() {
    sr.router();
});
map.on('endtileload', function() {
    console.log('endtileload');
    rm.setCurrentLocation();
});



SMap(map);
var hash = new L.Hash(map);