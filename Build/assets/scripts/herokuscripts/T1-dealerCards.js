/**
 Dealer business cards
 */

T1.dealerCards = ( function(){

	var _private = {
		container: $('#dealer-details'),
		map: null,
		markers: [],
		dealerLocation: null,
		currentLocation: null,
		breakpoints: {
			xs: T1.constants.SCREEN_XTRASMALL,
			sm: T1.constants.SCREEN_SMALL,
			md: T1.constants.SCREEN_MEDIUM,
			lg: T1.constants.SCREEN_LARGE
		},
		init: function(){
			if(m.container.size()) {
				PubSub.subscribe(c.MY_TOYOTA_LOGIN_SUCCESS, m.myToyotaLoginSuccess);
				PubSub.subscribe(T1.constants.ON_BREAKPOINT_CHANGE, m.breakpointChanged);
				PubSub.subscribe(c.GOOGLE_MAP_LOAD, m.initMap);
				T1.dealerFinder.initMaps();

				m.container.find('.dealer-contact-details h4').click(function() {
					var target = $(this).parent().find('>.row'),
						openedTarget = m.container.find('.details-section.open >div >.row');
					// toggle opened section
					if(!openedTarget.is(target)) {
						openedTarget.slideToggle(function() {
							openedTarget.parents('.details-section').toggleClass('open');
						});
					}
					// toggle current section
					target.slideToggle(function() {
						target.parents('.details-section').toggleClass('open');
					});
				});

				m.container.find('.btn-save').toggle(T1.myToyota.isAuthenticated()).click(m.save);
				m.container.find('.input-search input').keypress(m.handleKeyPress);
				m.container.find('.btn-search').click(m.search);
				m.container.find('.btn-back').click(m.showDetails);
			}
		},
		myToyotaLoginSuccess: function(event, data) {
			m.container.find('.btn-save').toggle(T1.myToyota.isAuthenticated());
		},
		save: function(e) {
			var q = $.ajax(c.URL_DEALERS + '/' + m.container.data('id'));
			var request = $.ajax({
				type: 'GET',
				url: c.URL_DEALERS + '/' + m.container.data('id')
			});
			request.done(function(data) {
				PubSub.publish(T1.constants.DEALER_SAVE, {
					dealer: data
				});
				PubSub.publish(T1.constants.HASH_ADD, '/publish/my_toyota_my_dealers');
			});
			request.fail(function(jqXHR, status, error) {
				alert(error || T1.labels.forms.errorSubmit);
			});
			e.preventDefault();
		},
		search: function(e) {
			var address = m.container.find('.input-search input').val();
			if (address.length !== 0) {
				new google.maps.Geocoder().geocode(
					{'address': address},
					function(results, status) {
						if (status === google.maps.GeocoderStatus.OK) {
							if (results[0]) {
								m.currentLocation = new google.maps.LatLng(
									results[0].geometry.location.lat(),
									results[0].geometry.location.lng()
								);
								m.loadDirections();
							}
							else {
								m.showGeoError(T1.labels.dealer.errorGeoNotFound);
							}
						}
						else {
							m.showGeoError(T1.labels.dealer.errorGeoFailed);
						}
					}
				);
			}
			else {
				m.showGeoError(T1.labels.dealer.errorNoValue);
			}
			e.preventDefault();
		},
		handleKeyPress: function(e) {
			if (e.keyCode === 13) {
				m.search(e);
			}
		},
		showDetails: function(e) {
			m.reset();
			m.container.find('.directions').addClass('hidden');
			m.container.find('.details').removeClass('hidden');
			if(m.container.hasClass('small-view')) {
				m.moveMapForSmallView();
			}
			e.preventDefault();
		},
		loadDealerMap: function(element) {
			if(element.size()) {
				var data = $.parseJSON(element[0].getAttribute('data-location'));
				m.dealerLocation = new google.maps.LatLng(data.lat, data.lon);
				m.map = new google.maps.Map(
					element[0],
					{
						center: m.dealerLocation,
						zoom : 10,
						mapTypeId : google.maps.MapTypeId.ROADMAP
					}
				);
				m.clearMarkers();
				m.setMarker(0, m.dealerLocation, m.container.find('.dealer-name').text());
			}
		},
		loadDirections: function() {
			m.initMap();

			var directionsDisplay = new google.maps.DirectionsRenderer({
					map : m.map,
					suppressMarkers : true
				}),
				directionsService = new google.maps.DirectionsService(),
				request = {
					origin: m.currentLocation,
					destination: m.dealerLocation,
					travelMode: google.maps.DirectionsTravelMode.DRIVING,
					unitSystem: google.maps.DirectionsUnitSystem.METRIC
				};

			directionsDisplay.setPanel(m.container.find('.directions-content').empty()[0]);
			directionsService.route(request, function(response, status) {
				if (status === google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
					m.container.find('.details').addClass('hidden');
					m.container.find('.directions').removeClass('hidden');
					if(m.container.hasClass('small-view')) {
						m.moveMapForSmallView();
					}
				}
			});

			m.clearMarkers();
			m.setMarker(98, m.currentLocation, m.container.find('.input-search input').val());
			m.setMarker(-1, m.dealerLocation, m.container.find('.dealer-name').text());
		},
		setMarker: function(index, location, title) {
			var markerNumber = (index < 9)? '0' + (index + 1) : (index + 1);
			m.markers.push(new google.maps.Marker({
				position: location,
				icon: T1.settings.dealer.markerPath + 'marker' + markerNumber + '.png',
				map: m.map,
				title: title
			}));
		},
		clearMarkers: function() {
			for (var i = 0; i < m.markers.length; i++) {
				m.markers[i].setMap(null);
			}
			m.markers = [];
		},
		initMap: function() {
			if(!m.map) {
				m.reset();
				if (Modernizr.geolocation) {
					m.container.find('.geo-location').css('display', 'block').click(function(e) {
						m.getLocation();
						e.preventDefault();
					});
				}
			}
		},
		reset: function() {
			m.container.find('.input-search input').val('');
			m.container.find('.bubble-direction').removeClass('active');
			m.loadDealerMap(m.container.find('.map-dealers'));
		},
		getLocation: function() {
			if (Modernizr.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
					m.currentLocation = new google.maps.LatLng(
						position.coords.latitude,
						position.coords.longitude
					);
					m.setCurrentAddress();
				});
			}
		},
		setCurrentAddress: function() {
			new google.maps.Geocoder().geocode(
				{'latLng': m.currentLocation},
				function(results, status) {
					if (status === google.maps.GeocoderStatus.OK) {
						if (results[1]) {
							m.container.find('.input-search input').val(results[1].formatted_address);
						} else {
							m.showGeoError(T1.labels.dealer.errorGeoNotFound);
						}
					} else {
						m.showGeoError(T1.labels.dealer.errorGeoFailed);
						return;
					}
				}
			);
		},
		showGeoError: function(message) {
			m.container.find('.geo-error').text(message).css({display:'block'});
		},
		breakpointChanged: function(event, breakpoint) {
			if(m.breakpoints[breakpoint] <= c.SCREEN_SMALL && !m.container.hasClass('small-view')) {
				m.moveMapForSmallView();
			}
			else if(m.breakpoints[breakpoint] > c.SCREEN_SMALL && m.container.hasClass('small-view')) {
				m.moveMapForLargeView();
			}
		},
		moveMapForSmallView: function() {
			m.container.addClass('small-view');
			m.container.find('.map-dealers').parents('.row:first').insertBefore('.dealer-contact-title:visible, .directions-content:visible');
		},
		moveMapForLargeView: function() {
			m.container.removeClass('small-view');
			m.container.find('.map-dealers').parents('.row:first').appendTo('#map-col');
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init
	};
}());