var T1 = T1 || {};

/**
 * myToyota
 *
 * USR: MDA
 *
 */
T1.myToyota = ( function () {
	'use strict';

	var _private = {
		isAuthenticated: null,
		overlayerOpen: false,
		displayedCars: null,
		savedCarsImageSize: {width:300, height:95},
		animationsDuration: 150,
		mapZoomLevel: 12,
		mapSize: [230, 122],
		storage: null,
		hidePrices: null,
		showRatesMonthly: false,
		mapsApiUrl: null,
		version: 1,
		eventsStack: {},
		stores:{
			cars: 'cars',
			dealers: 'dealers'
		},
		panes: {
			myCars: {id: 'pane-my-cars', form: '#form-my-cars', messages: {}},
			saveCar: {id: 'pane-save-car', forms: {save: '#form-save-car', login: '#form-login-save-car'}},
			myDealer: {id: 'pane-my-dealer', form: '#form-my-dealer'},
			ownersArea: {id: 'pane-owners-area'},
			resetPassword: {id: 'pane-reset-password', form: '#form-reset-password'},
			login: {id: 'pane-login', form: '#form-login'},
			register: {id: 'pane-register', form: '#form-register'},
			forgottenPassword: {id: 'pane-forgotten-password', form: '#form-forgotten-password'}
		},
		panesEvent: {
			'pane-register': T1.constants.MY_TOYOTA_REGISTER,
			'pane-forgotten-password': T1.constants.MY_TOYOTA_FORGOTTEN_PASSWORD,
			'pane-save-car': T1.constants.MY_TOYOTA_SAVE_CAR,
			'pane-reset-password': T1.constants.MY_TOYOTA_HASH_PASSWORD
		},
		classes: {
			loginForm: 'login-form',
			formSuccess: 'form-success',
			formError:T1.constants.CLASS_ERROR_FORM,
			carsExtended: 'extended',
			carExtendable: 'extendable'
		},
		init: function() {
			/* workaround to Microsoft internal error bug */
			m.initLocalStorage();

			/* set authenticated state */
			m.isAuthenticated = (T1.mypage && T1.mypage.user) ? true : false;

			/* define the constants */
			m.mapsApiUrl = T1.constants.URL_GOOGLE_STATIC_MAPS_API_DEV + '&zoom={ZOOM}&size={SIZE}&maptype=roadmap&sensor=false&visual_refresh=true&scale=2&center={POINT}&markers=color:red%7Clabel:C%7C{POINT}';

			/* my toyota events */
			PubSub.subscribe(c.MY_TOYOTA_MY_CARS, m.requestMyCars);
			PubSub.subscribe(c.MY_TOYOTA_MY_DEALERS, m.requestMyDealer);
			PubSub.subscribe(c.MY_TOYOTA_OWNERS_AREA, m.requestOwnersArea);
			PubSub.subscribe(c.MY_TOYOTA_LOGIN, m.requestLogin);
			PubSub.subscribe(c.MY_TOYOTA_LOGIN_SUCCESS, m.loginSuccess);
			PubSub.subscribe(c.MY_TOYOTA_RESET_PASSWORD, m.requestPasswordReset);
			PubSub.subscribe(c.MY_TOYOTA_HASH_PASSWORD, m.setPasswordHash);
			PubSub.subscribe(c.BEFORE_FORM_SUBMIT, m.beforeFormSubmit);
			PubSub.subscribe(c.SUBMIT_FORM_RETURN, m.formReturn);
			PubSub.subscribe(c.VALIDATE_FORM_RETURN, m.validateFormReturn);
			PubSub.subscribe(c.MY_TOYOTA_SAVE_CAR, m.requestSaveCar);
			PubSub.subscribe(c.MY_TOYOTA_GET_CAR, m.getCar);

			/* overlayer events*/
			PubSub.subscribe(c.PAGEOVERLAYER_CLOSED, m.overlayerClosed);
			PubSub.subscribe(c.PAGEOVERLAYER_LOAD, m.initOverlayer);

			/* car config events */
			PubSub.subscribe(c.CARCONFIG_SAVE_CONFIG, m.saveCar);
			PubSub.subscribe(c.CARCONFIG_END, m.storeCar);

			/* dealer search event */
			PubSub.subscribe(c.DEALER_SAVE, m.saveDealer);
			PubSub.subscribe(c.DEALER_SELECTED, function(event, data) { m.storeDealer(data); m.loadStoredDealers(); });

			m.hidePrices = (T1.settings.hidePrices === 'true');
			m.showRatesMonthly = (T1.settings.finance.showRatesMonthly === 'true');
			m.displayedCars = c.MY_TOYOTA_DISPLAYED_SAVED_CARS || 6;

			/* set localized error messages */
			m.panes.myCars.messages[404] = T1.labels.mytoyota.carConfigurationNotFound;
		},
		initLocalStorage: function() {
			try {
				m.storage = window.localStorage;
			}
			catch (e) {
				console.log('Initialization of local storage failed:' + e.message);
			}
		},
		initOverlayer: function(event, data){
			if(!m.overlayerOpen && data.el.find('#forms.my-toyota').size())
			{
				m.overlayerOpen = true;
				PubSub.subscribe(c.TABS_SWITCH, m.publishLocalTabEvent);
				$('#cancelSearchMyCar').click(m.resetSearchMyCarForm);
				$('#savedCarsExtender').click(m.toggleSavedCars);
				$('#cancelSaveMyCar').click(m.resetSaveACarForm);
				$('.toyota-tabs .login-link').click(function(e) {
					m.setLoginRedirection($(this).parents('.tab-pane').attr('id'));
				});
				$('.toyota-tabs .btn-cancel').click(m.cancelLogin);
				$('.toyota-tabs').click(m.closeAllOvl);
				$(m.panes.saveCar.forms.login).find('.input-row > div').addClass('col-sm-6');
				//T1.specialLink.initOnDemand($('#' + m.panes.ownersArea.id));
				m.setAuthenticatedState(m.isAuthenticated);
				m.loadUserData();
				m.loadStoredCars();
				m.loadStoredDealers();
			}
		},
		initSavedCarsOnDemand: function() {
			$('#savedCarsExtender').click(m.toggleSavedCars);
			m.setAuthenticatedState(m.isAuthenticated);
			m.loadSavedCars();
		},
		publishLocalTabEvent: function(evName, paneId) {
			for(var key in m.panes) {
				if(m.panes[key].id === paneId) {
					PubSub.publishSync(c.MY_TOYOTA_TAB_SWITCH, paneId);
					m.publishPaneEvent(paneId);
					return false;
				}
			}
		},
		publishPaneEvent: function(paneId){
			if(paneId && m.panesEvent[paneId]){
				PubSub.publish(m.panesEvent[paneId]);
			}
		},
		getActiveTab: function() {
			return $('.toyota-tabs a.active').attr('data-tab');
		},
		setAuthenticatedState: function(loggedIn){
			m.isAuthenticated = loggedIn;
			$('#forms.my-toyota').toggleClass('authenticated', loggedIn);
			if(!loggedIn) {
				if(T1.mypage) {T1.mypage.user = null;}
				$('.' + m.classes.loginForm).each(function(){this.reset();});
			}
		},
		requestMyCars: function() {
			m.requestMyToyota(m.panes.myCars.id);
		},
		requestMyDealer: function() {
			m.requestMyToyota(m.panes.myDealer.id);
		},
		requestOwnersArea: function() {
			m.requestMyToyota(m.panes.ownersArea.id);
		},
		requestLogin: function() {
			m.requestMyToyota(m.panes.login.id);
		},
		requestPasswordReset: function() {
			m.requestMyToyota(m.panes.resetPassword.id);
		},
		setPasswordHash: function() {
			$('#password-hash').val(window.location.hash.substr(window.location.hash.lastIndexOf('/') + 1));
		},
		requestAuthentication: function(){
			if(m.isAuthenticated) { m.setAuthenticatedState(false); }
			m.requestMyToyota(m.panes.login.id);
		},
		requestMyToyota: function(paneId) {
			if(!m.overlayerOpen) {
				PubSub.publish(c.PAGEOVERLAYER_OPEN, {url: decodeURIComponent($('#myToyota').data('url')) + '?tab=' + paneId, ajax: true, sync: true});

				var tokenTabSwitch = PubSub.subscribe(c.PAGEOVERLAYER_LOAD, function(){
					PubSub.publish(c.TABS_SWITCH, paneId);
					PubSub.unsubscribe(tokenTabSwitch);
				});
			}
		},
		searchACar: function(code, save) {
			var form = $(m.panes.myCars.form);
			form.find('#car-code').val(code);

			if(save) {
				$('#' + m.panes.myCars.id).addClass('hidden');

				m.addStackEvent(
					c.MY_TOYOTA_SEARCH_FOUND,
					function(oEvent, oData) {
						m.addStackEvent(
							c.TABS_SWITCH,
							function(oEvent, oData) {
								$('#' + m.panes.myCars.id).removeClass('hidden');
							}
						);

						form.find('.btn-save').click();
					}
				);
			}

			m.addStackEvent(
				c.TABS_SWITCH,
				function(oEvent, oData) {
					form.find('.btn-submit').click();
				}
			);
		},
		beforeFormSubmit: function(event, result) {
			if(result.form.is(m.panes.myCars.form)) {
				m.beforeSearchForm(event, result);
			}
			else if(result.form.is(m.panes.login.form) ||
				result.form.is(m.panes.saveCar.forms.login)) {
				result.json = true;
				result.data = JSON.stringify({
					email:result.form.find('input[name="email"]').val(),
					password:result.form.find('input[name="password"]').val()
				});
			}
			else if(result.form.is(m.panes.saveCar.forms.save)) {
				var searchedCar = $('#searchCarResult').data('searched-car'),
					savedCar = m.getSavedCar(searchedCar.id);

				// no double save of cars (check done on ids)
				if (!savedCar) {
					m.collectObject(m.stores.cars, searchedCar);
					result.json = true;
					result.data = JSON.stringify(m.getUser().data);
				} else {
					result.cancel = true;
					PubSub.publish(T1.constants.MY_TOYOTA_CAR_ALREADY_SAVED, savedCar);
					m.displayFormError(result.form, T1.labels.mytoyota.carAlreadySaved);
				}

			}
			else if(result.form.is(m.panes.resetPassword.form)) {
				result.json = true;
				result.data = JSON.stringify({
					key:$('#password-hash').val(),
					password:$('#reset-password').val()
				});
			}
		},
		beforeSearchForm: function(event, result) {
			result.url = T1.settings.loadSaveServer + c.URL_SUBMIT_FORM_MY_TOYOTA_SEARCH_CAR + '/' + result.form.find('#car-code').val() + '/short/';
		},
		formReturn: function(event, result){
			var returnState = {
				isError: false,
				message: null
			};

			if(m.overlayerOpen){
				m.resetFormClasses(result.form);
				if(result.status === 'success') {
					if(result.data.success || !m.errorMessage(result.data)) {
						if(result.form.is($(m.panes.myCars.form))) {
							m.formMyCarsReturn(event, result);
						}
						else if(result.form.is($(m.panes.login.form)) ||
							result.form.is($(m.panes.saveCar.forms.login))) {
							m.formLoginReturn(event, result);
						}
						else if(result.form.is($(m.panes.register.form)) ||
							result.form.is($(m.panes.forgottenPassword.form)) ||
							result.form.is($(m.panes.resetPassword.form))) {
							m.resetFormReturn(event, result);
						}
						else if(result.form.is($(m.panes.saveCar.forms.save))) {
							m.formSaveCarReturn(event, result);
						}
					}
					else {
						returnState = {
							isError: true,
							message: m.errorMessage(result.data)
						};
					}
				}
				else {
					result.showError = false;
					returnState = {
						isError: true,
						message: m.formStatusMessage(result.form, result.code) || result.message || result.status
					};
				}

				//handle error events
				if(returnState.isError){
					m.resetStackEvents();
					m.manageFormReturnError(result, returnState);
				}
			}
		},
		manageFormReturnError: function(result, returnState) {
			if(returnState.isError) {
				m.displayFormError(result.form, returnState.message);

				if(result.form.is($(m.panes.myCars.form))) {
					PubSub.publish(c.MY_TOYOTA_SEARCH_FAILED, {result: result, error: returnState.message});
				}
				else if(result.form.is($(m.panes.login.form))) {
					PubSub.publish(c.MY_TOYOTA_LOGIN_FAIL, {});
				}
			}
		},
		errorMessage: function(data) {
			return data.message || (data.error ? (data.error.message ? data.error.message : data.error) : null);
		},
		formStatusMessage: function(form, status) {
			var data;
			if(form.is($(m.panes.myCars.form))) {
				data = m.panes.myCars;
			}
			if(data && data.messages && data.messages[status]) {
				return data.messages[status];
			}
		},
		validateFormReturn: function(event, result) {
			if(m.overlayerOpen){
				if(result.form.is($(m.panes.register.form)) ||
					result.form.is($(m.panes.forgottenPassword.form)) ||
					result.form.is($(m.panes.resetPassword.form))) {
					result.validated = result.data.success;
				}
			}
		},
		formMyCarsReturn: function(event, result) {
			var container = $('#searchCarResult');
			m.loadACar(result.data, container, m.suggestDeleteCar);
			container.data('searched-car', result.data);
			$(m.panes.saveCar.forms.save).find('#save-car-name').val(result.data.car);
			result.form.addClass(m.classes.formSuccess);
			PubSub.publishSync(c.MY_TOYOTA_SEARCH_FOUND, {car: result.data.car});
		},
		formLoginReturn: function(event, result) {
			PubSub.publish(c.MY_TOYOTA_LOGIN_SUCCESS, result.data);

			if (result.form.is($(m.panes.login.form))) {
				m.loginRedirect();
			} else {
				PubSub.publish(c.TABS_SWITCH, m.panes.saveCar.id);
			}
		},
		loginRedirect: function() {
			var tabId = $('#' + m.panes.login.id).attr('data-tab-redirect') || m.panes.myCars.id;
			PubSub.publish(c.TABS_SWITCH, tabId);
		},
		loginSuccess: function(event, data) {
			m.setUser(data.user);
			m.setAuthenticatedState(data.success);
			m.loadUserData();
		},
		getUser: function() {
			return (T1.mypage && T1.mypage.user) ? T1.mypage.user : null;
		},
		setUser: function(user) {
			if(!T1.mypage) { T1.mypage = {}; }
			T1.mypage.user = user;
			m.checkDefaultStorage();
		},

		resetFormReturn: function(event, result) {
			result.form.get(0).reset();
		},
		formSaveCarReturn: function(event, result) {
			var searchedCar = $('#searchCarResult').data('searched-car'),
				savedCar = m.getSavedCar(searchedCar.id);

			m.setUser(result.data.user);
			m.loadSavedCars();
			m.resetSearchMyCarForm();
			m.resetSaveACarForm();
			m.extendSavedCar();
			PubSub.publish(c.TABS_SWITCH, m.panes.myCars.id);
			PubSub.publish(c.MY_TOYOTA_SAVED_CAR, {car: savedCar});
		},
		extendSavedCar: function(){
			if(m.isMySavedCarsExtended()) {
				$('#savedCars>.row:not(.template):not(:visible):last').slideDown(m.animationsDuration);
			}
		},
		// can be tested with {configCode: '1tfviAH'}
		saveCar: function(event, data) {
			if (m.isAuthenticated) {
				if(m.overlayerOpen) {
					m.searchACar(data.configCode, true);
				}
				else {
					m.addStackEvent(
						c.PAGEOVERLAYER_LOAD,
						function(oEvent, oData) {
							m.searchACar(data.configCode, true);
						}
					);
					PubSub.publish(c.HASH_CHANGE, '/publish/my_toyota_my_cars');
				}
			}
			else {
				m.addStackEvent(
					c.MY_TOYOTA_LOGIN_SUCCESS,
					function(oEvent, oData) {
						m.saveCar(event, data);
					}
				);
				PubSub.publish(c.HASH_CHANGE, '/publish/my_toyota_login');
			}
		},
		storeCar: function(msg, data) {
			if (m.storage) {
				m.requestCarInfo(data, true);
			}
		},
		requestCarInfo: function(data, isStorage, doneCallback, failCallback) {
			var request = $.ajax({
				type: 'GET',
				dataType: 'JSON',
				url: m.getCarInfoUrl(data)
			});
			request.done(doneCallback || m.getCarInfoSuccessHandle(isStorage));
			request.fail(failCallback || m.handleCarInfoRequestFail);
		},
		getCarInfoUrl: function(data) {
			var url = T1.settings.loadSaveServer + '/config/';

			if (data.configCode) {
				url += data.configCode;
			}
			else {
				if (data.modelId) {
					url += 'toyota/' + T1.settings.country + '/' + T1.settings.language + '/';
					url += data.modelId + '/' + data.carId + '/' + data.colourId + '/short/';
				}
				else if (data.ConfigurationID) {
					url += data.ConfigurationID + '/short';
				}
			}

			return url;
		},
		getCarInfoSuccessHandle: function(isStorage) {
			return function(data) {
				if (data.message || (data.error && data.error.message)) {
					m.showErrorMessage(m.errorMessage(data));
				} else {
					if (isStorage && !m.getStoredCar(data.id)) {
						m.storeObject(m.stores.cars, data);
						PubSub.publish(T1.constants.MY_TOYOTA_STORED_CAR, data);
					}
					else if (!isStorage && !m.getSavedCar(data.id)) {
						m.updateUserData(m.stores.cars, data);
					}
					else if (!isStorage && m.getSavedCar(data.id)) {
						PubSub.publish(T1.constants.MY_TOYOTA_CAR_ALREADY_SAVED, data);
						console.log(T1.labels.mytoyota.carAlreadySaved + ': ' + data.id);
					}
				}
			};
		},
		handleCarInfoRequestFail: function(jqXHR, status, error) {
			console.log(status + ': ' + error);
		},
		getStoredCar: function(id) {
			return m.getObject(m.getStorage(), m.stores.cars, id);
		},
		getSavedCar: function(id) {
			if(m.isAuthenticated) {
				return m.getObject(m.getUser().data.mytoyota, m.stores.cars, id);
			}
		},
		removeCar: function(e) {
			e.preventDefault();
			PubSub.publishSync(c.STATS_TRACK, {node: $(e.target)});
			m.removeObject(m.stores.cars, e.data.code, e.data.callback);
		},
		removeObject: function(store, id, callback) {
			var storage = m.getStorage();
			for (var c = 0; c < storage[store].length; c++) {
				if (parseInt(storage[store][c].id, 10) === parseInt(id, 10)) {
					storage[store].splice(c, 1);
					m.setStorage(storage);
					callback();
					break;
				}
			}
		},
		getObject: function(source, store, id, out) {
			var objects = source[store];
			for (var c = 0; c < objects.length; c++) {
				if (parseInt(objects[c].id, 10) === parseInt(id, 10)) {
					if (out) {
						out.index = c;
					}
					return objects[c];
				}
			}
		},
		storeDealer: function(data) {
			if(!m.getStoredDealer(data.id)) {
				m.storeObject(m.stores.dealers, data);
			}
		},
		getStoredDealer: function(id) {
			return m.getObject(m.getStorage(), m.stores.dealers, id);
		},
		saveDealer: function(event, data) {
			if(m.isAuthenticated) {
				// if logged in, save it
				var savedDealer = m.getSavedDealer(data.dealer.id);
				if(!savedDealer) {
					m.updateUserData(m.stores.dealers, data.dealer);
				}
				else {
					PubSub.publish(c.MY_TOYOTA_DEALER_ALREADY_SAVED, {dealer: data.dealer});
				}
			}
			else {
				PubSub.publishSync(c.HASH_REMOVE, '');
				if(m.overlayerOpen) {
					// if overlayer open
					m.setLoginRedirection(m.panes.myDealer.id);
					PubSub.publishSync(c.TABS_SWITCH, m.panes.login.id);
					m.setSaveDealerState(event, data);
				}
				else {
					// if overlayer not opened, open it
					m.addStackEvent(
						c.PAGEOVERLAYER_LOAD,
						function(oEvent, oData) {
							if(oData.el.find('#forms.my-toyota').size())
							{
								m.setSearchQuery(data.search);
								m.setLoginRedirection(m.panes.myDealer.id);
								m.setSaveDealerState(event, data);
							}
						}
					);
					PubSub.publishSync(c.HASH_ADD, '/publish/my_toyota_login');
				}
			}
		},
		setSaveDealerState: function(event, data) {
			m.addStackEvent(
				c.MY_TOYOTA_TAB_SWITCH,
				function(oEvent, oData) {
					m.clearStackEvent(c.MY_TOYOTA_LOGIN_SUCCESS);
					m.clearStackEvent(c.MY_TOYOTA_CANCEL_LOGIN);
				},
				function(oEvent, oData) {
					return oData != m.panes.login.id;
				}
			);

			m.addStackEvent(
				c.MY_TOYOTA_LOGIN_SUCCESS,
				function(oEvent, oData) {
					m.clearStackEvent(c.MY_TOYOTA_CANCEL_LOGIN);
					m.saveDealer(event, data);
				}
			);

			m.addStackEvent(
				c.MY_TOYOTA_CANCEL_LOGIN,
				function(oEvent, oData) {
					m.clearStackEvent(c.MY_TOYOTA_LOGIN_SUCCESS);
					$(m.panes.myDealer.form).find('a.btn-search-dealers i').click();
				}
			);
		},
		setSearchQuery: function(search) {
			if(search) {
				var form = $(m.panes.myDealer.form);
				form.find('.input-search input').val(search.query);
				form.find('input[name="options"]').prop('checked', false);
				$(search.options).each(function(index, value) {
					form.find('input[value="' + $(value).val() + '"]').prop('checked', true);
				});
			}
		},
		addStackEvent: function(event, callback, condition) {
			m.eventsStack[event] = m.eventsStack[event] || [];
			m.eventsStack[event].push({
				callback: callback,
				token: PubSub.subscribe(event, m.processStackEvent),
				condition: condition
			});
		},
		processStackEvent: function(event, data) {
			if(m.eventsStack[event]) {
				$.each(m.eventsStack[event], function(index, value) {
					if(!m.eventsStack[event][index].condition ||
						m.eventsStack[event][index].condition(event, data)) {
						PubSub.unsubscribe(m.eventsStack[event][index].token);
						m.eventsStack[event][index].callback(event, data);
					}
				});
				m.clearStackEvent(event);
			}
		},
		clearStackEvent: function(event) {
			if(m.eventsStack[event]) {
				$(m.eventsStack[event]).each(function(index, value) {
					PubSub.unsubscribe(m.eventsStack[event][index].token);
				});
				delete m.eventsStack[event];
			}
		},
		resetStackEvents: function() {
			for(var key in m.eventsStack) {
				m.clearStackEvent(key);
			}
			m.eventsStack = {};
		},
		getSavedDealer: function(id) {
			if(m.isAuthenticated) {
				return m.getObject(m.getUser().data.mytoyota, m.stores.dealers, id);
			}
		},
		updateUserData: function(store, object) {
			if (m.isAuthenticated) {
				m.collectObject(store, object);
				var request = $.ajax({
					type: 'POST',
					dataType: 'JSON',
					beforeSend: function(xhrObj){
						xhrObj.setRequestHeader('Content-Type', 'application/json');
						xhrObj.setRequestHeader('Accept', 'application/json');
					},
					url: T1.request.getDomainName() + c.URL_SUBMIT_FORM_MY_TOYOTA_SAVE_DEALER,
					data: JSON.stringify(m.getUser().data)
				});
				request.done(function(data, status) {
					if(data.success) {
						m.setUser(data.user);
						m.loadSavedDealers();
						if(store == m.stores.dealers) {
							var savedDealer = m.getSavedDealer(object.id);
							if(savedDealer) {
								PubSub.publish(c.MY_TOYOTA_SAVED_DEALER, {dealer: savedDealer});
							}
						}
					}
					else {
						m.unCollectObject(store, object.id);
						m.showErrorMessage(m.errorMessage(data));
						m.manageUpdateUserError(store, object, m.errorMessage(data));
					}
				});
				request.fail(function(data, status) {
					m.unCollectObject(store, object.id);
					m.showErrorMessage(m.errorMessage(data));
					m.manageUpdateUserError(store, object, m.errorMessage(data));
				});
			}
		},
		manageUpdateUserError: function(store, object, error) {
			if(store == m.stores.dealers) {
				PubSub.publish(c.MY_TOYOTA_SAVE_DEALER_FAILED, {
					dealer: object,
					error: error
				});
			}
		},
		removeDealer: function(e) {
			e.preventDefault();
			PubSub.publishSync(T1.constants.STATS_TRACK, {node: $(e.target)});
			m.removeObject(m.stores.dealers, e.data.code, e.data.callback);
		},
		storeObject: function(key, value) {
			if(m.storage) {
				value.storeDate = globalize.format(new Date(), 'd');
				value.saved = false;
				if(key === m.stores.cars) {
					m.addCarCustomName(value);
				}
				var myt = m.getStorage();
				myt[key].push(value);
				m.setStorage(myt);
			}
		},
		getStorage: function() {
			var myt = $.parseJSON(m.storage.mytoyota || null) || m.defaultStorage();

			if (!myt || myt.version !== m.version) {
				myt = m.resetStorage();
			}

			return myt;
		},
		setStorage: function(def) {
			m.storage.mytoyota = JSON.stringify(def);
		},
		resetStorage: function() {
			var def = m.defaultStorage();
			m.storage.mytoyota = JSON.stringify(def);
			return def;
		},
		defaultStorage: function() {
			return {
				version: m.version,
				cars: [],
				dealers: []
			};
		},
		checkDefaultStorage: function() {
			if(!T1.mypage.user.data) { T1.mypage.user.data = {}; }
			if(!T1.mypage.user.data.mytoyota) {
				T1.mypage.user.data.mytoyota = m.defaultStorage();
			}
		},
		collectObject: function(key, value, index) {
			if (m.isAuthenticated) {
				value.storeDate = globalize.format(new Date(), 'd');
				value.saved = true;
				if (key === m.stores.cars) {
					m.addCarCustomName(value);
				}
				if (index !== undefined) {
					m.getUser().data.mytoyota[key].splice(index, 0, value);
				} else {
					m.getUser().data.mytoyota[key].push(value);
				}
			}
		},
		addCarCustomName: function(data) {
			data.customName = $('#save-car-name').val() || null;
		},
		unCollectObject: function(key, value) {
			if(m.isAuthenticated) {
				var storage = m.getUser().data.mytoyota[key];
				for(var c = 0; c < storage.length; c++) {
					if(parseInt(storage[c].id, 10) === parseInt(value, 10)) {
						storage.splice(c, 1);
						break;
					}
				}
			}
		},
		loadUserData: function() {
			if(m.isAuthenticated) {
				m.checkDefaultStorage();
				m.loadSavedCars({skipSocialInit: true});
				m.loadSavedDealers();
			}
		},
		loadSavedCars: function(data) {
			data = data || {};
			if(m.isAuthenticated) {
				var cars = m.getUser().data.mytoyota.cars,
					section = $('#savedCars'),
					template = section.find('>.row.template'),
					extended = m.isMySavedCarsExtended();

				if(!data.insert){
					section.find('>.row:not(.template)').remove();
				}
				for(var i = (cars.length - 1); i >= 0; i--){
					var row = template.clone().removeClass('template'),
						car = section.find('>.row:not(.template) > div');

					if(car.size() >= m.displayedCars) { row.addClass(m.classes.carExtendable); }
					if(extended) { row.show(); }
					m.appendObjRow(section, row, cars[i], m.loadACar, m.suggestDeleteCar);
				}
				section.find('.template').appendTo(section);
				if(!data.skipSocialInit) { m.initSocialButtons(); }
				m.setExtenderCarsCount(section.find('>.row:not(.template) > div').size());
			}
		},
		loadACar: function(car, node, delCallback){
			if (!(car && car.id && car.car)) {
				console.log(car.code || 'not a car');
				return false;
			}

			node.find('.obj-desc').attr('data-obj-code', car.id);
			node.find('img').attr('src', m.getCarImagePath(car.code));
			node.find('.hybrid').toggle(car.hybrid || false);
			node.find('.title').html(m.htmlDecode(car.customName || car.car));
			if (!m.hidePrices && car.price) {
				var list = car.price.listWithDiscount,
					priceCellHtml = m.htmlDecode(globalize.format(list, 'c'));
				node.find('.price').html(priceCellHtml);
			}
			//TODO: the "edit terms" link is hidden for now
			node.find('.desc a').hide();

			//TODO: replace hardcoded values with actual rates
			if (m.showRatesMonthly && T1.labels.pricePerMonth) {
				var repaymentsTxt = T1.labels.pricePerMonth.replace('%a', 220).replace('%m', 12);
				node.find('.desc strong').text(repaymentsTxt);
			}

			node.find('.code i').html(m.htmlDecode(car.code));
			node.find('.date').text(car.storeDate);
			node.find('.saved').toggle(car.saved || false);
			node.find('.btn-edit').on('click', function(e) {
				e.preventDefault();
				//	PubSub.publish(T1.constants.HASH_ADD, c.URL_CAR_CONFIG_OVERLAYER + 'tyCode=' + car.code);
				// hash change necessary for working flow
				PubSub.publish(T1.constants.HASH_CHANGE, c.URL_CAR_CONFIG_OVERLAYER + 'tyCode=' + car.code);
			});
			node.find('.btn-read-more').attr('href', car.carChapterUrl);
			node.find('.btn-delete').click(delCallback);

			return true;
		},
		htmlDecode: function(value) {
			return $('<div/>').html(value).text();
		},
		getCarImagePath: function(code) {
			if(code) {
				return T1.settings.CCISServer + '/configuration/' + code +
					'/width/' +	m.savedCarsImageSize.width + '/height/' +
					m.savedCarsImageSize.height + '/exterior-32.png';
			}
			return null;
		},
		loadStoredCars: function() {
			m.loadStoredObjects(
				$('#recentlyViewedCars'),
				m.getStorage().cars,
				m.loadACar,
				m.suggestRemoveCar);
		},
		loadStoredDealers: function() {
			m.loadStoredObjects(
				$('#recentlyViewedDealers'),
				m.getStorage().dealers,
				m.loadADealer,
				m.suggestRemoveDealer);
		},
		loadStoredObjects: function(section, objs, loadCallback, delCallback) {
			var template = section.find('>.row.template');
			section.find('>.row:not(.template)').remove();
			for(var i = (objs.length - 1); i >= 0; i--){
				var row = template.clone().removeClass('template');

				m.appendObjRow(section, row, objs[i], loadCallback, delCallback);
			}
			section.find('.template').appendTo(section);
		},
		appendObjRow: function(section, row, obj, loadCallback, delCallback) {
			var pos = section.find('>.row:not(.template):last() > div').size();

			if (loadCallback(obj, row, delCallback)) {
				if (pos % 2 === 0) {
					section.append(row);
				} else {
					section.find('>.row:not(.template):last()').append(row.find('> div'));
				}
			}
		},
		loadSavedDealers: function(insert) {
			if(m.isAuthenticated) {
				var dealers = m.getUser().data.mytoyota.dealers || [],
					section = $('#savedDealers'),
					template = section.find('>.row.template');

				if(!insert){
					section.find('>.row:not(.template)').remove();
				}
				for(var i = (dealers.length - 1); i >= 0; i--){
					var row = template.clone().removeClass('template'),
						dealer = section.find('>.row:not(.template) > div');

					m.appendObjRow(section, row, dealers[i], m.loadADealer, m.suggestDeleteDealer);
				}
				section.find('.template').appendTo(section);
				m.initSocialButtons();
			}
		},
		loadADealer: function(dealer, node, delCallback){
			if (dealer) {
				var protocol = 'http://',
					url = /^http:\/\//.test(dealer.url) ? dealer.url : protocol + dealer.url,
					linkElement = node.find('.website');

				node.find('.obj-desc').attr('data-obj-code', dealer.id);
				node.find('img').attr('src', m.getMapUrl(dealer));
				node.find('.name').html(m.htmlDecode(dealer.name));
				node.find('.address:eq(0)').html(m.htmlDecode(dealer.address.address1));
				node.find('.address:eq(1)').html(m.htmlDecode(dealer.address.zip + ' ' + dealer.address.city + (dealer.address.region ? '(' + dealer.address.region + ')' : '')));
				linkElement.attr('href', m.htmlDecode(url)).toggle(url !== protocol);
				linkElement.attr('target', '_blank');
				// TO DO: remove website node completely if no dealer url with length > 0
				node.find('.website').attr('data-bt-value', (((typeof dealer.url) === 'string') && (dealer.url.length > 0)) ? dealer.url : '');
				node.find('.website span').html(m.htmlDecode(dealer.url));
				node.find('.btn-details').attr('href', m.htmlDecode(url)).css({display: $.trim(dealer.url) !== '' ? 'inline-block' : 'none'});
				node.find('.btn-map').attr('href', m.htmlDecode(url));
				if(url === protocol) { node.removeAttr('href'); }
				node.find('.btn-delete').click(delCallback);
				return true;
			}
			return false;
		},
		getMapUrl: function(dealer){
			var point = dealer.address.origin.lon + ',' + dealer.address.origin.lat;
			return m.mapsApiUrl.replace('{API_KEY}', T1.settings.dealer.googleAPIKey).
				//replace('{CLIENT_ID}', GMAPS_CLIENT_ID).
				replace('{ZOOM}', m.mapZoomLevel).
				replace('{SIZE}', m.mapSize.join('x')).
				replace(new RegExp('{POINT}', 'g'), point);
		},
		initSocialButtons: function(){
			PubSub.publishSync(c.EPRIVACY_LOAD_COMPONENT, {
				root: $('#savedCars > .row:not(.template), #savedDealers > .row:not(.template)'),
				callback: function() {
					$('#savedCars .share-options').each(function() {
						var $this = $(this),
							link = $this.parents('.form-btn').find('.btn-read-more').attr('href');
						$this.find('a').attr('data-link', link);
					});
				}
			});
		},
		toggleSavedCars: function() {
			var displayedRows = m.displayedCars / 2,
				rows = $('#savedCars').find('>.row:gt(' + (displayedRows - 1) + '):not(.template)'),
				extended = rows.find(':visible').size() > displayedRows,
				q = $({});

			if(extended){
				rows = $(rows.get().reverse());
			}

			$('#savedCarsExtender').toggleClass(m.classes.carsExtended, !extended);

			rows.each(function(){
				var row = $(this);
				q.queue(function(next){
					row.animate({
						height: 'toggle',
						opacity: 'toggle'
					}, m.animationsDuration, next);
				});
			});
		},
		isMySavedCarsExtended: function(){
			return $('#savedCarsExtender').hasClass(m.classes.carsExtended);
		},
		setExtenderCarsCount: function(count){
			$('#savedCarsExtender i.count').text(count);
			$('#savedCarsExtender').toggle(count > m.displayedCars);
		},
		resetSearchMyCarForm: function(e) {
			if(e) { e.preventDefault(); }
			$('#car-code').focus().val('');
			m.resetFormClasses($(m.panes.myCars.form));
		},
		resetSaveACarForm: function() {
			$('#save-car-name').val('');
			m.resetFormClasses($(m.panes.saveCar.forms.save));
		},
		setLoginRedirection: function(tab) {
			$('#' + m.panes.login.id).attr(
				'data-tab-redirect',
				tab
			);
		},
		cancelLogin: function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			m.loginRedirect();
			PubSub.publishSync(c.MY_TOYOTA_CANCEL_LOGIN);
		},
		requestSaveCar: function() {
			if($(m.panes.myCars.form).hasClass(m.classes.formSuccess)){
				$('#searchCarResult > .row:first').clone().appendTo(
					$('#pane-save-car .col-xtra-info').empty());
			}
		},
		getCar: function(event, data) {
			data.out = {car:null};
			data.out.car = m.getSavedCar(data.id) || m.getStoredCar(data.id);
		},
		/* remove objects */
		suggestDeleteCar: function(e){
			var target = $(this),
				carDesc = target.parents('.form-btn').siblings('.obj-desc');

			e.preventDefault();

			m.ovlRemoveObj(carDesc, m.carDeleted, m.requestDeleteCar, m.stores.cars, m.getUser().data.mytoyota);
		},
		suggestRemoveCar: function(e){
			var target = $(this),
				carDesc = target.parents('.obj-desc');

			e.preventDefault();

			m.ovlRemoveObj(carDesc, m.loadStoredCars, m.removeCar, m.stores.cars, m.getStorage());
		},
		suggestDeleteDealer: function(e){
			var target = $(this),
				dealerDesc = target.parents('.form-btn').siblings('.obj-desc');

			e.preventDefault();

			m.ovlRemoveObj(dealerDesc, m.dealerDeleted, m.requestDeleteDealer, m.stores.dealers, m.getUser().data.mytoyota);
		},
		suggestRemoveDealer: function(e){
			var target = $(this),
				dealerDesc = target.parents('.obj-desc');

			e.preventDefault();

			m.ovlRemoveObj(dealerDesc, m.loadStoredDealers, m.removeDealer, m.stores.dealers, m.getStorage());
		},
		ovlRemoveObj: function(objDesc, callback, query, store, datasource) {
			if(!objDesc.find('.del-ovl').size()) {
				var code = objDesc.attr('data-obj-code'),
					section = objDesc.parents('section:first'),
					clone = section.find('>.del-ovl.template').clone(),
					out = {index: 0};

				clone.attr('data-obj-code', code).removeClass('template');
				section.find('.del-ovl:not(.template)').remove();
				objDesc.append(clone);
				objDesc.find('.btn-yes').click(
					{
						store: store,
						code: code,
						object: m.getObject(datasource, store, code, out),
						index: out.index,
						callback: callback
					}, query);
				objDesc.find('.btn-no').click(function(e) {
					e.preventDefault();
				});
			}
		},
		/* delete objects */
		requestDeleteCar: function(e) {
			e.preventDefault();

			m.requestDelete(e, T1.request.getDomainName() + c.URL_MY_TOYOTA_DELETE_CAR);
		},
		requestDeleteDealer: function(e) {
			e.preventDefault();

			m.requestDelete(e, T1.request.getDomainName() + c.URL_MY_TOYOTA_DELETE_DEALER);
		},
		requestDelete: function(e, url) {
			if(m.isAuthenticated) {
				m.unCollectObject(e.data.store, e.data.code);
				var request = $.ajax({
					type: 'POST',
					dataType: 'JSON',
					url: url,
					beforeSend: function(xhrObj){
						xhrObj.setRequestHeader('Content-Type', 'application/json');
						xhrObj.setRequestHeader('Accept', 'application/json');
					},
					data: JSON.stringify(m.getUser().data)
				});
				request.done(e.data.callback(e));
				request.fail(m.objDeleteError(e));
			}
		},
		carDeleted: function(e){
			return function(data, status) {
				if(data.success){
					m.setUser(data.user);
					m.loadSavedCars();
				}
				else {
					m.objDeleteError(e, m.errorMessage(data))();
				}
			};
		},
		dealerDeleted: function(e){
			return function(data, status) {
				if(data.success){
					m.setUser(data.user);
					m.loadSavedDealers();
				}
				else {
					m.objDeleteError(e, m.errorMessage(data))();
				}
			};
		},
		objDeleteError: function(e, msg){
			return function(jqXHR, status, error) {
				var delObj = $(e.target).parents('.del-ovl');
				m.collectObject(e.data.store, e.data.object, e.data.index);
				delObj.addClass('error')
					.find('h5').html(msg || jqXHR.responseText || T1.labels.forms.errorSubmit);
				delObj.animate({height: delObj.get(0).scrollHeight}, m.animationsDuration);
			};
		},
		closeAllOvl: function(e) {
			if(!$(e.target).is('.btn-edit, .btn-delete, .btn-yes')) {
				$('#forms.my-toyota .del-ovl:not(.template)').remove();
			}
		},
		/* misc. */
		displayFormError: function(form, msg){
			form.find('.error-message').html(msg);
			form.addClass(m.classes.formError);
		},
		resetFormClasses: function(form){
			form.removeClass(m.classes.formError + ' ' + m.classes.formSuccess);
		},
		overlayerClosed: function(event, data){
			if(m.overlayerOpen && $(data.overlayer).find('#forms.my-toyota').size()){
				PubSub.unsubscribe(m.publishLocalTabEvent);
				m.resetStackEvents();
				m.overlayerOpen = false;
			}
		},
		showErrorMessage: function(message) {
			console.log(message);
			PubSub.publish(c.TOAST_CUSTOM, {
				customText: message,
				centerScreen: true,
				timeout: 2000
			});
		}
	};

	var m = _private,
		c = T1.constants;

	return {
		init: _private.init,
		isAuthenticated: function() { return _private.isAuthenticated; },
		requestCarInfo: function(data, doneCallback, failCallback) {
			m.requestCarInfo(data, false, doneCallback, failCallback);
		}
	};
}());