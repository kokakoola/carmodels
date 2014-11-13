var T1 = T1 || {};

/**
*
*    Video: loads, shows and controls the video element
*
*/
T1.video = (function() {
	'use strict';

	var _private = {
		_player: null,
		_playerVideoNode: null,
		_playerNode: null,
		_playerId: 'videoWrapper',
		_posterImage: null,
		_evPlay: null,
		_evFull: null,
		_flashFallback: false,
		_autoplayToken: null,
		isIeMobile: T1.utilities.isIeMobile,

		init: function() {
			var m = _private;
			PubSub.subscribe(T1.constants.VIDEO_CLICK, m.loadVideo);
			PubSub.subscribe(T1.constants.VIDEO_STOP, m.stop);
			PubSub.subscribe(T1.constants.PAGEOVERLAYER_CLOSE, m.stop); // stop if the video is in page overlayer
			PubSub.subscribe(T1.constants.VIDEO_CREATEPLAYER, m.addVideoPlayer);
			PubSub.subscribe(T1.constants.VIDEO_RESET, m.reset);
			m._flashFallback = T1.utilities.ieVersion <= 10 && !m.isIeMobile;

			// binding event for video player in overlayer
			$('body').on('click', '.video-overlayer', m.showVideoOverlayer);
		},
		//options: {'controls': true, 'autoplay': false, 'preload': 'auto'},
		// create player if its not existing otherwise refer to it and return it
		createPlayer: function(posterImage) {
			var m = _private;
			if(m._flashFallback) vjs.options.techOrder= ["flash", "html5", "links"];
			if (!m._playerNode) {
				m._playerNode = m._playerVideoNode = $('<video id='+ m._playerId+' poster='+posterImage+' preload=\'auto\'></video>').addClass("video-js vjs-default-skin t1-skin");
				m._playerNode.appendTo($('body'));
				if(window.vjs){
					// use video js
					m._player = vjs(m._playerId,{'controls': true, 'autoplay': false, 'preload':'auto'});
				}else{
					// use the basic htlm5 player & add the default controls
					m._player = m._playerNode.get(0);
					m._playerNode.on('touchend', m.togglePlay);
				}
				m._playerNode = $('#'+ m._playerId).css({'width':'100%', 'height':'100%'});
			}
			PubSub.publish(T1.constants.VIDEO_CREATEDPLAYER, {});
			return m._player;
		},
		/**
		 * Loads & plays new videosources from a posternode
		 * @param eventName (string) name of the event that triggers the load function
		 * @param posterImage_fl (object: jQuery object or domNode) the posternode (wrapper that contains all data-video attributes)
		 */
		loadVideo: function(eventName, posterImage_fl) {
			// IF there's a <video> tag somewhere in the Document
			// change its place to the videoNode place
			// that is an <img> tag with
			// data-video-[mp4|ogg|webm|flv] data attribute
			// then HIDE the posterImage node and show *all* the others
			var m = _private,
				posterImage = $(posterImage_fl) || $('.item.active .posterWrapper'),
				videoLinks = {
					mp4: posterImage.data('video-mp4'),
					webm: posterImage.data('video-webm'),
					ogv: posterImage.data('video-ogv'),
					flv: posterImage.data('video-flv')},
				vtt = posterImage.data('video-vtt'),
				vttLang = posterImage.data('video-vtt-lang'),
				videoSource = [];

			// on autoload unsubscribe the pageoverlayer open event
			if(m._autoplayToken) PubSub.unsubscribe(m._autoplayToken);

			//create videosources
			if(videoLinks.mp4 && !m._flashFallback) videoSource.push({type:'video/mp4', src: videoLinks.mp4});
			if(videoLinks.webm && !m._flashFallback) videoSource.push({type:'video/webm', src: videoLinks.webm});
			if(videoLinks.ogv && !m._flashFallback) videoSource.push({type:'video/ogg', src: videoLinks.ogv});
			if(videoLinks.flv) videoSource.push({type:'video/flv', src: videoLinks.flv});

			//check if player exists -> otherwise create a new one
			var posterImageOrLazy = posterImage.find('img').attr('src') || posterImage.find('img').attr('data-lazy-load');
			if(!m._player) m._player = m.createPlayer(posterImageOrLazy);

			//move the playernode to the posterimage nodes parent
			posterImage.parent().prepend(m._playerNode);

			// stop the posternode fade in animation
			posterImage.stop(); //Stop animation when the video starts while fading in !IMPORTANT 4 IE!

			// hide the all inactive video wrappers
			$('.posterWrapper').css({'display':'block'});
			// show the inactive posters
			posterImage.css({'display':'none'});

			// trying to change the poster image within video-js itself
			if(window.vjs){
				$('#videoWrapper_html5_api').attr('poster',posterImageOrLazy);
			}else{
				m._playerNode.attr('poster', posterImageOrLazy);
			}

			// switch source & play the video
			m.switchSource(videoSource);

			//add subtitles
			if(vtt) m.loadSubs(vtt, vttLang);

			//play the movie
			m.play();
		},
		/**
		 * switch sources of the videoplayer
		 * @param (Array of Objects) sources [{
		 *     type: (string) content-type (example video/mp4)
		 *     src: (string) path to the video source
		 * }]
		 */
		switchSource: function(sources){
			var m = _private;
			if(window.vjs){
				//non-IOS systems will use the videojs player
				m._player.src(sources);
			}else{
				//IOS will use the standard html5 player
				if(sources[0].type==='video/mp4'){
					m._playerNode.attr('src', sources[0].src);
				}else{
					m._playerNode.attr('src', '');
					m.showError(T1.labels ? T1.labels.videoSourceNotSupported : 'Not supported source');
				}
			}
		},
		/**
		 * show an error message on the video player
		 * @param errString (String)
		 */
		showError: function(errString){
			var m = _private,
				playerParentNode = m._playerNode.parent(),
				errNode = playerParentNode.find('.error-inner');
			if(errNode.length===0){
				var outerErrNode = $('<div></div>').addClass('error').appendTo(playerParentNode);
				errNode = $('<div></div>').addClass('error-inner').appendTo(outerErrNode);
			}
			errNode.html(errString);
		},
		/**
		 * stop the current playing video
		 * @param eventName (string) stop event for the video (provided automatically via PubSub)
		 */
		stop: function(eventName) {
			var m = _private;
			if (m._player){
				m._player.pause();
				// remove the subtitles
				m.removeSubs();
				/*IE FIX ON FLASH CALLBACK RECREATE THE OBJECT TAG*/
				if(m._flashFallback || (m._playerNode.find('> object').length > 0)){
					//restore the posternode, if available
					//m._playerNode.closest('.item').find('.posterWrapper').css({'display': 'block'});
					m._playerNode.prev('.posterWrapper').css({'display' : 'block'});
					//on flash fallback DESTROY DESTROY DESTROY
					m._player.dispose();
					m._playerNode.remove();
					m._playerNode = null;
					m._player = null;
				}
			}
		},

		/**
		 * load the selected subtitles
		 * @param subs (String) path to the subtitles
		 * @param lang (String) language of the subtitle
		 */
		loadSubs: function(subs, lang){
			var m = _private;
			m.removeSubs();
			var language = lang || 'en';
			var track = m._player.addTextTrack('Captions',' ',language,{src: subs});
			track.show();
		},

		/**
		 * remove all subtitles
		 */
		removeSubs: function(){
			var m = _private;
			if(m._player.textTracks()[0] !== undefined){
				m._player.textTracks()[0].disable();
				m._player.textTracks()[0].hide();
				m._playerNode.find('.vjs-captions').remove();
				m._player.textTracks().splice(0,1);
			}
		},


		/**
		 * plays the video (if a video player exists)
		 * @param eventName
		 */
		play: function(eventName){
			var m = _private;
			if(m._player) m._player.play();
		},


		/**
		 * toggle play is used to fix the ipad scroll issue (no controls can be shown on the ipad videos)
		 */
		togglePlay: function(){
			var m = _private;
			if(m._player) {
				if(m._player.paused){
					m._player.play();
				}else{
					m._player.pause();
				}
			}
		},
		/**
		 * reset all posternodes & remove the videoplayer
		 */
		reset: function(){
			var m = _private;
			//exit if there is no player
			if(! m._playerNode) return;
			//stop current video
			m.stop();
			//show all posternodes
			$('.posterWrapper').css({'display': 'block'});
			//remove the videoplayer from the dom-tree
			m._playerNode.remove();
		},
		/*
		* Will create a video-player and add the events
		* options:{
		* target: target element where the video needs to be added to
		* figure: if figure is provided is replaced by video(target will be ignored)
		* srcMp4: url to the mp4 movie
		* srcOgv: url to the ogv movie
		* srcWebm: url to the webm movie
		* srcFlv: url to the flv movie
		* poster: link to the image which should be used as posternode
		* autoplay: automatically plays the video
		* lazyLoadPoster: puts the source in the data-lazy-load attribute
		* }
		* */
		addVideoPlayer: function(evName, options){
			var m = _private,
				mediaNode = $('<div class="posterWrapper"></div>'),
				target = options.target || $('body'),
				autoplay = options.autoplay || false,
				posterImg = $('<img>'),
				_hasFlash = T1.utilities.hasFlash(),
				_ieVersion = T1.utilities.ieVersion,
				getFlash = 'https://get.adobe.com/flashplayer/',
				lazyLoadPoster = options.lazyLoadPoster || false,
				playButton = $('<div class="sprite-videoplayer-start-button" style="display:block;" onclick=""></div>'),
				videoClickEvent = function(e){
					e.preventDefault();
					PubSub.publish(T1.constants.VIDEO_CLICK, $(this).parent());
				},
				videoSources = {};

			if (m._flashFallback) {
				if (!_hasFlash) {
					mediaNode = $('<div class=noflash ><h2>'+T1.labels.FLASH_ERROR+'</h2><p>'+T1.labels.FLASH_YOU_NEED+' <a href='+getFlash+' >'+T1.labels.FLASH_FLASHPLAYER+'</a> '+T1.labels.FLASH_TO_PLAY+'</p></div>');
					return false;
				}
			}
			// create a posternode
			var posterAttr = {};
			posterAttr[lazyLoadPoster ? 'data-lazy-load' : 'src'] = options.poster;
			posterImg.attr(posterAttr);
			// add the video to the wrapper node
			if(options.srcMp4){videoSources['data-video-mp4'] = options.srcMp4;}
			if(options.srcWebm){videoSources['data-video-webm'] = options.srcWebm;}
			if(options.srcOgv){videoSources['data-video-ogv'] = options.srcOgv;}
			if(options.srcFlv){videoSources['data-video-flv'] = options.srcFlv;}
			if(options.srcVtt){videoSources['data-video-vtt'] = options.srcVtt;}
			if(options.srcVttLang){videoSources['data-video-vttLang'] = options.srcVttLang;}
			mediaNode.attr(videoSources);
			// append play button container
			mediaNode.append(playButton);
			mediaNode.append(posterImg);
			/* WHY IS THIS LIKE THIS, YOU WONDER?
			*	First: There's no design from Amaze related to play-button before videos;
			*	Second: If the Poster Image is 10000000K MB it will take a butload of time for the user to understand that that's a video
			*	Third:	IF the user does not wish to see a video (or wait for the posterImage to load) he can dismiss it right away or click it promptly
			 */
			// append the medianode to the target element
			if(options.figure) {
				options.figure.replaceWith(mediaNode);
			} else {
				target.append(mediaNode);
			}
			//connect the click event
//			var evTrigger = m.isNative ? 'touchend' : 'click';
			var evTrigger = T1.utilities.hasEvent('ontouchend') ? 'touchend' : 'click';
			playButton.off(evTrigger, videoClickEvent).on(evTrigger, videoClickEvent);
			// autoplay if needed
			if(autoplay && window.vjs && !m.isIeMobile){
				// reconnect the autoplay function
				m._autoplayToken = PubSub.subscribe(T1.constants.PAGEOVERLAYER_LOAD, function(){
					PubSub.publish(T1.constants.VIDEO_CLICK, mediaNode);
				});
			}
		},

		showVideoOverlayer: function(e) {
			e.preventDefault();
			location.hash = '/video/' + $(this).attr('id');
		}
	};
	return {
		init: _private.init,
		loadVideo: _private.loadVideo,
		stop: _private.stop,
		play: _private.play,
		createPlayer: _private.createPlayer
	};
}());