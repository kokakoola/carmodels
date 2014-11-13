var T1 = T1 || {};

/**
 *	hash:
 *
 */

T1.hash = ( function () {
	'use strict';

	var _private = {
		lastHash: '',
		lastHashes: [],

		init: function() {
			var m = _private;
			$(window).on('hashchange', m.hashChanged);
			PubSub.subscribe(T1.constants.HASH_ADD, m.addHash);
			PubSub.subscribe(T1.constants.HASH_CHANGE, m.changeHash);
			PubSub.subscribe(T1.constants.HASH_REMOVE, m.removeHash);
			PubSub.subscribe(T1.constants.HASH_REPLACE, m.replaceHash);
			PubSub.subscribe(T1.constants.HASH_REWRITE, m.rewriteHash);
		},

		//publish initial hash changes on mode change (this will guarantee that all event subscriptions have taken place)
		initDesktop: function(){
			if(location.href.indexOf('#')!==-1) _private.hashChanged();
		},

		//publish initial hash changes on mode change (this will guarantee that all event subscriptions have taken place)
		initMobile: function(){
			if (location.href.indexOf('#') > -1) {
				_private.hashChanged();
			}
		},

		/**
		 * get the hash data
		 * @returns {string}
		 */
		getHash: function(){
			return location.href.indexOf('#')===-1 ? '' : location.href.replace(/.*#/,'');
		},

		/**
		 * get last hash
		 * @returns {string}
		 */
		getLastHash:function(){
			var m = _private,
				strHash = m.getHash();
			return strHash.indexOf('/+/')===-1 ? strHash : strHash.replace(/.*\/\+\//, '/');
		},

		/**
		 * splits the current hashes, and returns an array with the hashobject
		 */
		getAllHashActions: function(){
			return _private.getHash().split('/+');
		},

		/**
		 * Capture hashchanges (#/action/param1/param2/param3/...)
		 * @param e
		 */
		hashChanged : function(e) {
			var m = _private,
				strHash = '',
				hashes = m.getAllHashActions(),
				newHashes = [],
				removedHashes = m.lastHashes.slice();

			//collect all removed and new hashes
			var alreadyExisted, currentHash, prevHash;
			for (var iCurrentHash = 0; iCurrentHash < hashes.length; iCurrentHash++) {
				currentHash = hashes[iCurrentHash];
				alreadyExisted = false;
				for (var iPrevHash = 0; iPrevHash < m.lastHashes.length; iPrevHash++) {
					prevHash = m.lastHashes[iPrevHash];
					if (prevHash.toLowerCase() === currentHash.toLowerCase()) {
						alreadyExisted = true;
						delete removedHashes[iPrevHash];
					}
				}
				if (!alreadyExisted) {
					newHashes.push(currentHash);
				}
			}

			//close overlayers for each hash which was removed
			for (var iHash = 0; iHash < removedHashes.length; iHash++) {
				if (removedHashes[[iHash]]) {
					PubSub.publishSync(T1.constants.PAGEOVERLAYER_CLOSE, {});
				}
			}

			//run all new hashes
			for (iHash = 0; iHash < newHashes.length; iHash++) {
				strHash = newHashes[iHash];
				// run hash command
				if (strHash !== '#' && strHash !== '') {
					var arrHash = strHash.split('/'),
						action = (arrHash.length > 1) ? arrHash[1].toLowerCase() : '',
						params = (arrHash.length > 2) ? arrHash.splice(2, arrHash.length - 1) : '';
					m.runHash(action, params);
				}
			}

			//set the last hashes
			m.lastHashes = hashes;
		},

		/**
		 * Run 1 hash action
		 * @param action
		 * @param params
		 */
		runHash: function (action, params) {
			var hashActions = {
				AJAX			:'ajax',
				CAROUSEL_STOP	:'stop_carousel',
				GALLERY			:'gallery',
				IFRAME			:'iframe',
				MOBILE			:'mobile',
				PUBLISH			:'publish',
				SPOTLIGHT		:'spotlight',
				VIDEO			:'video',
				YOUTUBE			:'youtube'
			};

			if (action === hashActions.PUBLISH) {
				// fetch initial parameters from the url
				var iParam = 1,
					param,
					arrParams = [],
					objParams = {};

				if (params.length > 1) {
					for (iParam; iParam < params.length; iParam++) {
						var currentParam = params[iParam];

						if (currentParam.indexOf('=') === -1) {
							if (currentParam.length > 0) {
								arrParams.push(decodeURIComponent(currentParam));
							}
						} else {
							param = currentParam.split('=');
							objParams[param[0]] = decodeURIComponent(param[1]);
						}
					}
				}

				// run event with the parameters
				PubSub.publishSync(T1.constants[params[0].toUpperCase()], arrParams.length !== 0 ? arrParams : objParams);
			} else if (action === hashActions.AJAX || action === hashActions.IFRAME) {
				var decodedParam = decodeURIComponent(params[0]),
					pageOverLayerParams = {},
					isIframe = (action === 'iframe');
				if (params.length > 1) {
					pageOverLayerParams.pageName = decodeURIComponent(params[1]);
				}
				pageOverLayerParams[isIframe ? 'iframe' : 'ajax'] = true;
				if (isIframe) {
					if(! T1.utilities.isIOS()) pageOverLayerParams.noScroll = true;
				}

				pageOverLayerParams[decodedParam.match('[.\/]') ? 'url' : 'el'] = decodedParam;
				pageOverLayerParams.sync = true;

				PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, pageOverLayerParams);
			} else if (action === hashActions.GALLERY) {
				PubSub.publish(T1.constants.GALLERY_ITEM_CLICK, {
					el: $('#' + params[0]),
					index: parseInt(params[1], 10)
				});
			} else if (action === hashActions.SPOTLIGHT) {
				var container = $('#' + params[0]);
				container.addClass("gallery");
				PubSub.publish(T1.constants.GALLERY_ITEM_CLICK, {
					el: container,
					index: parseInt(params[1], 10)
				});
			} else if (action === hashActions.YOUTUBE) {
				var youtubeParams = {youtubeId: params[0], noScroll: true};
				if (params.length > 1) {
					youtubeParams.pageName = decodeURIComponent(params[1]);
				}
				PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, youtubeParams);
			} else if (action === hashActions.VIDEO) {
				var posterNode = $('#' + params[0]),
					video = {
						'autoplay': 'true',
						'srcMp4': posterNode.data('video-mp4'),
						'srcWebm': posterNode.data('video-webm'),
						'srcOgv': posterNode.data('video-ogv'),
						'srcFlv': posterNode.data('video-flv'),
						'poster': posterNode.data('poster'),
						'srcVtt': posterNode.data('video-vtt'),
						'srcVttLang': posterNode.data('video-vttlang')
					};
				PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN, {'video': video, 'el': posterNode, 'noScroll': true, fitImages: true});
			} else if (action === hashActions.MOBILE) {
				var reqObj = {id: params[0]};
				if (params[1]) {
					reqObj.param = params[1];
				}
				PubSub.publish(T1.constants.MOBILE_OPEN, reqObj);
			} else if (action === hashActions.CAROUSEL_STOP) {
				$('.carousel').carousel('pause');
			}
		},

		addHash: function(evName, strHash){
			var m = _private,
				currentHash = m.getHash();
			if(strHash.charAt(0)!=='/'){strHash = '/' + strHash;}
			location.hash = currentHash + (currentHash==='' ? '' : '/+') + strHash;
		},

		removeHash: function(evName, strHash){
			var m = _private;
			if(strHash==='') strHash = m.getLastHash();
			if(strHash.charAt(0)!=='/'){strHash = '/' + strHash;}
			location.hash = m.getHash().replace(strHash, '').replace(/\/\+$/,'');
		},

		changeHash: function(evName, strHash){
			if(strHash.charAt(0)!=='/'){strHash = '/' + strHash;}
			location.hash = strHash;
		},

		replaceHash: function(evName, data){
			var strHash = location.hash.replace(data.oldValue, data.newValue);

			location.hash = strHash;
		},

		rewriteHash: function(evName, data){
			if(window.history){
				history.replaceState(null, null, data);
			}else{
				location.replace(data);
			}
		}
	};
	return {
		init : _private.init,
		initDesktop: _private.initDesktop,
		initMobile: _private.initMobile
	};
}());
