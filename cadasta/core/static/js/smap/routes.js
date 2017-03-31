var rm = RouterMixins;
var CreateRoutes = function(){
  'use strict';
  var routes = {};
  rm.init();

  function route(path, el, controller, eventHook=null) {
    routes[path] = {
      el: el,
      controller: controller,
      eventHook: eventHook
    };
  }

  route('/map', 'detail',
    function() {
      rm.hideDetailPanel();
      rm.hideModal();
      rm.updateSidebar('map');
  });

  route('/overview', 'detail',
    function() {
      rm.displayDetailPanel();
      rm.resetCurrentLocationStyle();
      rm.updateSidebar('overview');
  });

  route('/', 'detail',
    function() {
      rm.displayDetailPanel();
      rm.resetCurrentLocationStyle();
      rm.updateSidebar('overview');
      
      // if (options.projectExtent && !window.location.hash.includes('/?coords=')) {
      //   map.fitBounds(options.projectExtent);
      // }
  });


  // *** SPATIAL RECORDS ***
  route('/records/location', 'detail',
    function() {
      rm.displayDetailPanel();
    },
    function(){
      rm.setCurrentLocation();
      rm.locationDetailHooks();
      rm.detachFormSubmission(rm.getCurrentLocationUrl());

      // global function
      dataTableHook();
  });

  route('/records/location/overview', 'detail',
    function() {
      rm.displayDetailPanel();
    },
    function(){
      rm.setCurrentLocation();
      rm.setCurrentActiveTab('overview');
      rm.locationDetailHooks();
      rm.detachFormSubmission(rm.getCurrentLocationUrl());

      // global function
      dataTableHook();
  });

  route('/records/location/resources', 'detail',
    function() {
      rm.displayDetailPanel();
    },
    function(){
      rm.setCurrentLocation();
      rm.setCurrentActiveTab('resources');
      rm.locationDetailHooks();
      rm.detachFormSubmission(rm.getCurrentLocationUrl());

      // global function
      dataTableHook();
  });

  route('/records/location/relationships', 'detail',
    function() {
      rm.displayDetailPanel();
    },
    function(){
      rm.setCurrentLocation();
      rm.setCurrentActiveTab('relationships');
      rm.locationDetailHooks();
      rm.detachFormSubmission(rm.getCurrentLocationUrl());

      // global function
      dataTableHook();
  });

  route('/records/location/new', 'detail',
    function() {
      rm.displayEditDetailPanel();
  });

  route('/records/location/edit', 'detail', 
    function() {
      rm.setCurrentLocation();
      rm.displayEditDetailPanel();
    },
    function(){
      rm.formSubmission('location-wizard', rm.getCurrentLocationUrl());
  });

  route('/records/location/delete', 'modal',
    function() {
      rm.setCurrentLocation();
      rm.displayModal();
    },
    function(){
      rm.formSubmission(this.el, '#/overview');
  });

  route('/records/location/resources/add', 'modal',
    function() {
      rm.displayModal();
    }, 
    function() {
      rm.setCurrentActiveTab('resources');
      rm.formSubmission(this.el, rm.getCurrentLocationUrl() + '/?tab=resources');
  });

  route('/records/location/resources/new', 'modal', 
    function() {
      rm.displayModal();
    }, 
    function() {
      rm.setCurrentActiveTab('resources');
      rm.uploadResourceHooks();
      rm.formSubmission(this.el, rm.getCurrentLocationUrl()  + '/?tab=resources', rm.uploadResourceHooks);
  });

  route('/records/location/relationships/new', 'modal',
    function() {
      rm.displayModal();

    }, function() {
      rm.setCurrentActiveTab('relationships');
      rm.relationshipHooks();
      rm.formSubmission(this.el, rm.getCurrentLocationUrl()  + '/?tab=relationships', rm.relationshipHooks);
    });


  // *** RELATIONSHIPS ***
  route('/records/relationship', 'detail',
    function() {
      rm.displayDetailPanel();
    },
    function() {
      rm.setCurrentActiveTab('relationships');
      rm.setCurrentLocation($("#current-location").attr('href'));
      rm.setCurrentRelationshipUrl();
      rm.detachFormSubmission(rm.getCurrentRelationshipUrl());

      // global function
      dataTableHook();
  });

  route('/records/relationship/edit', 'detail',
    function() {
      rm.displayEditDetailPanel();
    }, function(){
      rm.setCurrentLocation($("#current-location").attr('href'));
      rm.formSubmission(this.el, rm.getCurrentRelationshipUrl());
  });

  route('/records/relationship/delete', 'modal',
    function() {
      rm.displayModal();
    },
    function(){
      rm.formSubmission(this.el, rm.getCurrentLocationUrl());
  });

  route('/records/relationship/resources/add', 'modal',
    function() {
      rm.displayModal();
    }, function() {
      rm.formSubmission(this.el, rm.getCurrentRelationshipUrl());
  });

  route('/records/relationship/resources/new', 'modal',
    function() {
      rm.displayModal();
    }, function() {
      rm.uploadResourceHooks();
      rm.formSubmission(this.el, rm.getCurrentRelationshipUrl(), rm.uploadResourceHooks);
  });

  return routes;
};
