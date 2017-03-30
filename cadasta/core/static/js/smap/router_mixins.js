var state;

var RouterMixins = {
  settings: {
    first_load: true,
    current_location: {url: null, bounds: null},
    current_relationship: {url: null},
    el: {
      'detail': 'project-detail',
      'modal': 'additional-modals',
    },
    forms: {
      'detail': '#detail-form',
      'modal': '#modal-form',
      'location-wizard': '#location-wizard',
    },
    last_hash: '',
  },

  init: function() {
    state = this.settings;
  },

  /***************
  DETAIL PANEL VS. MODAL
  ****************/
  resizeMap: function(size) {
    size = size || 300;
    $('#project-map').height(size);

    window.setTimeout(function() {
      map.invalidateSize();
    }, 400);
  },

  displayDetailPanel: function() {
    this.hideModal();
    if ($('.content-single').hasClass('detail-hidden')) {
      $('.content-single').removeClass('detail-hidden');
      this.resizeMap();
    }

    if ($('#' + state.el.detail).hasClass('detail-edit')) {
      $('#' + state.el.detail).removeClass('detail-edit');
    }
  },

  displayEditDetailPanel: function() {
    this.hideModal();
    if ($('.content-single').hasClass('detail-hidden')) {
      $('.content-single').removeClass('detail-hidden');
      this.resizeMap();
    }

    if (!$('#' + state.el.detail).hasClass('detail-edit')) {
      $('#' + state.el.detail).addClass('detail-edit');
    }
  },

  hideDetailPanel: function() {
    this.hideModal();
    if (!$('.content-single').hasClass('detail-hidden')) {
      $('.content-single').addClass('detail-hidden');
      this.resizeMap($(window).height() - 30);
    }
  },

  displayModal: function() {
    if (!$('#' + state.el.modal).is(':visible')) {
      $('#' + state.el.modal).modal('show');
    }
  },

  hideModal: function() {
    if ($('#' + state.el.modal).is(':visible')) {
      $('#' + state.el.modal).modal('hide');
    }
  },

  // Only useful if multiple sidebar buttons lead to the map
  updateSidebar: function(sidebar_button) {
    if (!$('#sidebar').hasClass(sidebar_button)) {
      $('#sidebar').removeClass().addClass(sidebar_button);
    }
  },

  /***************
  UPDATING THE STATE
  ****************/
  setGeoJsonLayer: function(layer) {
    state.geojsonlayer = layer;
  },

  getRouteElement: function(el) {
    return state.el[el];
  },

  setCurrentLocation: function(url=null) {
    window_hash = window.location.hash;

    // in relationship_detail, it pulls the current_location from the location link.
    if (url && !state.current_location.url) {
      state.current_location.url = url;

    } else if (!window_hash.includes(state.current_location.url)) {
      // catches both /?tab and /?coords
      state.current_location.url = window_hash;

      if (window_hash.includes('/?tab=')) {
        state.current_location.url = window_hash.substr(0, window_hash.indexOf('/?tab='));
      } else if (window_hash.includes('/?coords=')) {
        state.current_location.url = window_hash.substr(0, window_hash.indexOf('/?coords='));
      }

      this.setCurrentActiveTab('overview');
    }

    this.setCurrentLocationBounds();
  },

  setCurrentRelationshipUrl: function() {
    if (state.current_relationship.url !== window.location.hash) {
      state.current_relationship.url = window.location.hash;
    }
  },

  getCurrentLocationUrl: function() {
    return state.current_location.url;
  },

  getCurrentRelationshipUrl: function() {
    return state.current_relationship.url;
  },

  centerOnCurrentLocation: function() {
    if (state.current_location.bounds) {
      var bounds;
      var location = state.current_location.bounds;
      if (typeof(location.getBounds) === 'function'){
        bounds = location.getBounds();
      } else {
        // If the spatial unit is a marker
        var latLngs = [location.getLatLng()];
        bounds = L.latLngBounds(latLngs);
      }

      if (bounds.isValid()){
        map.fitBounds(bounds);
      }
    }
  },

  setCurrentLocationStyle: function() {
    var location = state.current_location.bounds;
    if (location.setStyle) {
      location.setStyle({color: '#edaa00', fillColor: '#edaa00', weight: 3});
    }
  },

  resetCurrentLocationStyle: function() {
    // before state.current_location is updated, the old state needs to be reset
    if (state.current_location.bounds) {
      if (state.current_location.bounds.setStyle) {
        state.current_location.bounds.setStyle({color: '#3388ff', fillColor: '#3388ff', weight: 2});
      }

      feature = state.current_location.bounds.feature;
      state.current_location.bounds._popup.setContent(this.nonActivePopup(feature));
    }
  },

  setCurrentLocationBounds: function() {
    var layers = state.geojsonlayer.geojsonLayer._layers;
    var url = state.current_location.url || window.location.hash;

    for (var i in layers) {
      if (url.includes(layers[i].feature.id)) {
        this.resetCurrentLocationStyle();

        state.current_location.bounds = layers[i];
        if (state.first_load) {
          this.centerOnCurrentLocation();
          state.first_load = false;
        }
        this.setCurrentLocationStyle();

        map.closePopup();
        layers[i]._popup.setContent(this.activePopup(layers[i].feature));
      }
    }
  },

  activateTab: function(tab) {
    // For the location details page. Tabs are built using bootstrap
    var tab_options = ['overview', 'resources', 'relationships'];
    tab_options.splice(tab_options.indexOf(tab), 1);

    $('#' + tab + '-tab').addClass('active');
    $($('#' + tab + '-tab').children()[0]).attr({'aria-expanded':"true"});
    $('#' + tab).addClass('active');

    for (var i in tab_options) {
      $('#' + tab_options[i] + '-tab').removeClass('active');
      $($('#' + tab_options[i] + '-tab').children()[0]).attr({'aria-expanded':"false"});
      $('#' + tab_options[i]).removeClass('active');
    }
  },

  setCurrentActiveTab: function(tab) {
    this.activateTab(tab);
  },

  setLastHashPath: function(hash) {
    state.last_hash = hash;
  },

  getLastHashPath: function() {
    return state.last_hash;
  },

  setFirstLoad: function(val) {
    if (state.first_load != val) {
      state.first_load = val;
    }
  },

  /***************
  ADDING EVENT HOOKS
  ****************/

  uploadResourceHooks: function() {
    original_file = $('input[name="original_file"]').val();

    if (original_file) {
      $('a.file-link').text(original_file);
      $('a.file-link').attr('download', original_file);
    }

    $('.file-input').change(function(event) {
      var file = event.target.files[0];

      $('a.file-link').on('link:update', function() {
          $('a.file-link').text(file.name);
          $('a.file-link').attr('download', file.name);
      });

      $('input[name="original_file"]').val(file.name);
      $('input[name="details-original_file"]').val(file.name);

      var ext = file.name.split('.').slice(-1)[0];
      var type = file.type || MIME_LOOKUPS[ext];
      $('input[name="mime_type"]').val(type);
    });

    $('a.file-remove').click(function() {
      $('.file-well .errorlist').addClass('hidden');
      $(this).parents('.form-group').removeClass('has-error');
    });
  },

  relationshipHooks: function() {
    var template = function(party) {
      if (!party.id) {
        return party.text;
      }
      return $(
        '<div class="party-option">' +
        '<strong class="party-name">' + party.text + '</strong>' +
        '<span class="party-type">' + party.element.dataset.type + '</span>' +
        '</div>'
      );
    };
    $("#party-select").select2({
      minimumResultsForSearch: 6,
      templateResult: template,
      theme: "bootstrap",
    });

    $('.datepicker').datepicker({
      yearRange: "c-200:c+200",
      changeMonth: true,
      changeYear: true,
    });

    // /* eslint-env jquery */
    $('#add-party').click(function(){
      $('#select-party').toggleClass('hidden');
      $('#new-item').toggleClass('hidden');
    });

    $('button#add-party').click(function() {
      $('#new_entity_field').val('on');
    });

    $('table#select-list tr').click(function(event) {
      const target = $(event.target).closest('tr');
      const relId = target.attr('data-id');
      target.closest('tbody').find('tr.info').removeClass('info');
      target.addClass('info');
      $('input[name="id"]').val(relId);
    });

    function disableConditionals() {
      $('.party-co').addClass('hidden');
      $('.party-gr').addClass('hidden');
      $('.party-in').addClass('hidden');
      $('.party-co .form-control').prop('disabled', 'disabled');
      $('.party-gr .form-control').prop('disabled', 'disabled');
      $('.party-in .form-control').prop('disabled', 'disabled');
    }

    function enableConditions(val) {
      const types = ['co', 'gr', 'in'];
      types.splice(types.indexOf(val), 1);
      $('.party-' + val).removeClass('hidden');
      $('.party-' + val + ' .form-control').prop('disabled', '');
      for (var i in types) {
        $('.party-' + types[i]).addClass('hidden');
        $('.party-' + types[i] +  '.form-control').prop('disabled', 'disabled');
      }
    }

    function toggleParsleyRequired(val) {
      const typeChoices = ['in', 'gr', 'co'];
      $.each(typeChoices, function(idx, choice) {
        if (val === choice) {
          $.each($('.party-' + val + ' .form-control'), function(idx, value) {
            if (value.hasAttribute('data-parsley-required')) {
              $(value).attr('data-parsley-required', true);
              $(value).prop('required', 'required');
              label = $(value)[0].labels[0];
              $(label).addClass('required');
            }
          });
        } else {
          $.each($('.party-' + choice + ' .form-control'), function(idx, value) {
            if (value.hasAttribute('data-parsley-required')) {
              $(value).attr('data-parsley-required', false);
              $(value).prop('required', '');
              label = $(value)[0].labels[0];
              $(label).addClass('required');
            }
          });
        }
      });
    }

    function toggleStates(val) {
      if (val === '') {
        disableConditionals();
      } else {
        enableConditions(val);
        toggleParsleyRequired(val);
      }
    }

    var val = $('.party-type').val().toLowerCase();
    toggleStates(val);


    $('select.party-type').on('change', function(e) {
      const val = e.target.value.toLowerCase();
      toggleStates(val);
    });

    $('select.party-select').on('change', function(e) {
      toggleStates('');
    });
  },

  locationDetailHooks: function() {
    function formatHashTab(tab) {
      var hash = window.location.hash;
      var coords = '';

      if (hash.includes('/?coords=')) {
        coords = hash.substr(hash.indexOf('/?coords='));
        hash = hash.substr(0, hash.indexOf('/?coords='));
      }

      if (hash.includes('/?tab=' + tab)) {
        return;
      }

      if (hash.includes('/?tab=')) {
        hash = hash.split('/?tab=')[0];
      }
      window.location.hash = hash + '/?tab=' + tab + coords;
      rm.setCurrentActiveTab('resources');
    }

    $('#resources-tab').click(function() {
      formatHashTab('resources');
    });

    $('#overview-tab').click(function() {
      formatHashTab('overview');
    });

    $('#relationships-tab').click(function() {
      formatHashTab('relationships');
    });
  },

  /***************
  INTERCEPTING FORM SUBMISSIONS
  ****************/
  formSubmission: function(form_type, success_url, eventHook=null){
    var form = state.forms[form_type] || form_type;
    var detach = false;
    var parent = this;

    // if form_type is a complete form, it came from detachFormSubmission
    if (form === form_type) {
      detach = true;
    }

    $(form).submit(function(e){
      e.preventDefault();
      var target = e.originalEvent || e.originalTarget;
      var formaction = $('.submit-btn', target.target ).attr('formAction');

      var data = $(this).serializeArray().reduce(function(obj, item) {
          obj[item.name] = item.value;
          return obj;
      }, {});

      var posturl = $.ajax({
        method: "POST",
        url: formaction,
        data: data,
        success: function(response, status, xhr) {
          form_error = posturl.getResponseHeader('Form-Error');
          if (form_error) {
            form_type = state.el[form_type] || 'detail';
            var el = document.getElementById(form_type);
            el.innerHTML = response;

            if (eventHook) {
              eventHook();
            }

          } else {
            if (detach) {
              sr.router(true);
            } else {
              window.location.replace(success_url);
            }
          }
        }
      });
    });
  },

  detachFormSubmission: function(success_url){
    var parent = this;
    $.each($('.detach-form'), function(i, form){
      parent.formSubmission(form, success_url);
    });
  },

  /******************
  EXTRA HTML INSERTS
  ******************/
  permissionDenied: function(error){
    return "<div class='alert alert-dismissible alert-warning' role='alert'>" +
           "<button type='button' class='close' data-dismiss='alert' aria-label='Close'>" +
           "<span aria-hidden='true'>×</span>" +
           "</button>" + error + "</div>";
  },

  nonActivePopup: function(feature) {
    return "<div class=\"text-wrap\"><h2><span>Location</span>" +
              feature.properties.type +
            "</h2></div>" +
            "<div class=\"btn-wrap\"><a href='#/" +
              feature.properties.url +
            "' id='spatial-pop-up' class='btn btn-primary btn-sm btn-block'>" +
              options.trans.open +
            "</a></div>";
  },

  activePopup: function(feature) {
    return "<div class=\"text-wrap\"><h2><span>Location</span>" +
              feature.properties.type +
            "</h2></div>" +
            "<div class=\"btn-wrap\"><span class=\"btn-sm btn-block\">" +
              options.trans.current_viewing +
              "</span></div>";
  },
};
