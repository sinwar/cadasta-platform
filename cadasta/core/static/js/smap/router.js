// Based on http://joakim.beng.se/blog/posts/a-javascript-router-in-20-lines.html
var SimpleRouter = function(map){
  var rm = RouterMixins;
  var routes = new CreateRoutes();

  function router(force_reload=false) {
    var async_url = '/async' + location.pathname;
    var hash_path = location.hash.slice(1) || '/';
    var tab;

    if (hash_path.includes('/?coords=')) {
      hash_path = hash_path.substr(0, hash_path.indexOf('/?coords=')) || '/';
      console.log('Includes coords');
      rm.setFirstLoad(false);
    }

    if (hash_path.includes('/?tab=')) {
      tab = hash_path.substr(hash_path.indexOf('/?tab=') + 6);
    }

    // Prevents router from reloading every time the coords changes.
    if (force_reload === false) {
      if (rm.getLastHashPath() === hash_path || hash_path === '/search') {
        return;
      }
    }

    if (!hash_path.includes('/records/')) {
      console.log('Doesnt include records');
      rm.setFirstLoad(false);
    }

    if (hash_path !== '/') {
      async_url = async_url + hash_path.substr(1) + '/';
    }

    var route = routes[hash_path] || null;

    // Removes record id from hash_path to match key in routes.
    if (!route) {
      var records = ['/records/location', '/records/relationship'];
      var actions = ['/edit', '/delete', '/resources/add', '/resources/new', '/relationships/new'];
      var new_hash_path;

      for (var i in records) {
        if (hash_path.includes(records[i])) {
          new_hash_path = records[i];
        }
      }

      for (var j in actions) {
        if (hash_path.includes(actions[j])) {
          new_hash_path = new_hash_path + actions[j];
        }
      }

      if (tab) {
        new_hash_path = new_hash_path + '/' + tab;
      }

      route = routes[new_hash_path];
    }


    var el = document.getElementById(rm.getRouteElement(route.el));
    var geturl = $.ajax({
      type: "GET",
      url: async_url,
      success: function (response, status, xhr) {
        permission_error = geturl.getResponseHeader('Permission-Error');
        anonymous_user = geturl.getResponseHeader('Anonymous-User');

        if (permission_error) {
          window.location.hash = "/overview";
          if ($('.alert-warning').length === 0) {
            $('#messages').append(rm.permissionDenied(permission_error));
          }
        } else if (anonymous_user) {
          window.location = "/account/login/?next=" + window.location.pathname;
        } else {
          route.controller();
          el.innerHTML = response;
          if (route.eventHook) {
            route.eventHook();
          }
        }
      }
    });

    rm.setLastHashPath(hash_path);
  }

  return {
    router: router,
  };
};
