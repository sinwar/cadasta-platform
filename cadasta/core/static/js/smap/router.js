// Based on http://joakim.beng.se/blog/posts/a-javascript-router-in-20-lines.html
var SimpleRouter = function(map){
  var rm = RouterMixins;
  routes = new CreateRoutes();

  function router(reload=false) {
    var hash_path = location.hash.slice(1) || '/';
    var coords = '';
    var tab = 'overview';

    if (hash_path.includes('/?coords=')) {
      hash_path = hash_path.split('/?coords=');
      hash_path = hash_path[0] || '/';
      coords = '/?coords=';
    }

    if (hash_path.includes('/?tab=')) {
      tab = hash_path.split('/?tab=')[1];
    }


    /***
    
    location = http://localhost:8000/organizations/cadasta/projects/london-2/#/records/location/5abiqthihbb3xyz3jkh3akra/?tab=resources/?coords=14/51.5066/-0.1802

    hash_path = #/records/location/5abiqthihbb3xyz3jkh3akra/?tab=resources/?coords=14/51.5066/-0.1802
    Two things we need to know:
    - contains coords?
    - which tab?

    */

    if (!reload && hash_path === rm.getLastHashPath()) {
      return;
    } else if (hash_path === '/search') {
      return;
    }


    var async_url = '/async' + location.pathname;
    if (hash_path !== '/') {
      async_url = async_url + hash_path.substr(1) + '/';
    }

    var route = routes[hash_path] ? routes[hash_path] : null;

    // Removes record id from hash_path to match key in routes.
    if (!route) {
      var records = ['/records/location', '/records/relationship'];
      var actions = ['/edit', '/delete', '/resources/add', '/resources/new', '/relationships/new'];
      var tabs = ['overview', 'resources', 'relationships'];
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

      for (var k in tabs) {
        if (hash_path.includes('/?tab=' + tabs[k])) {
          new_hash_path = new_hash_path + '/' + tabs[k];
        }
      }
      route = routes[new_hash_path];
    }

    var el = document.getElementById(rm.getRouteElement(route.el));
    var geturl = $.ajax({
      type: "GET",
      url: async_url,
      success: function (response, status, xhr) {
        console.log('GET request success');
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

    rm.setLastHashPath(hash_path + coords);
  }

  return {
    router: router,
  };
};
