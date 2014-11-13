/*
 * T1 global script
 * KGH: publish global events for scroll/swipe
 */

var T1 = T1 || {};
T1.client = T1.client || {
	"version": "2.5c (stable)",
	"date"		: "200141104",
	"release": [
		"Merge pull request #988 in T1/t1-client from merge-fix/new-cta-bar to master* commit '173a3abb8d152146148a4ba95d5007e2972b7ad8':",
		"  Move cta bar redesign to master branch.",
		"  Move cta bar redesign to master branch.",
		"Move cta bar redesign to master branch.",
		"Move cta bar redesign to master branch.",
		"Merge pull request #987 in T1/t1-client from merge-fix/social-share-privacy to master* commit '9907b88beb3d91204e3362788c79fdac8dc17a72':",
		"  Bugfix #Guy: Errors when facebook button blocked by ads blocker.",
		"Merge pull request #985 in T1/t1-client from carconfig-qr-code to master* commit '2af7b73204a594e6b9b5d3848b1b6a856620d192':",
		"  Bugfix: INC000000274893: loading carconfig with QR code",
		"Merge pull request #983 in T1/t1-client from change-request/eprivacy to master* commit '39fb69e9853f88bdfc85e1d56af6f219799ba80a':",
		"  bugfix #INC000000281066: Default settings Cookie policy TNL changed.",
		"Merge branch 'master' of http://cde.toyota-europe.com/stash/scm/t1/t1-client into merge-fix/social-share-privacy",
		"Bugfix #Guy: Errors when facebook button blocked by ads blocker.",
		"Merge pull request #986 in T1/t1-client from merge-fix/social-share-privacy to master* commit '64e51ce4a2fd867015b17d284b771445a956881a':",
		"Bugfix: INC000000274893: loading carconfig with QR code",
		"bugfix #INC000000281066: Default settings Cookie policy TNL changed.",
		"bugfix : hash : move close to the same stack than publish (publish is ran SYNC -> close should get SYNC ed as well to run within the same execution-stack)",
		"Merge pull request #981 in T1/t1-client from bugfix/dealer-finder to master* commit 'ac1f2576112d154f3baf59d6c3b3d84aa4ec7a9d':",
		"  bugfix #INC000000262538: #IE8: Dealer finder not working with IE8",
		"  bugfix #INC000000256379: Fix when region is missing.",
		"Merge pull request #980 in T1/t1-client from bugfix/js-special-includes to master* commit '230915f594be3d57f2530a8004670add3367afe3':",
		"  JS special includes. Use a promise for synch. (respect order of scripts).",
		"  JS special includes: use promise for synch.",
		"bugfix #INC000000262538: #IE8: Dealer finder not working with IE8",
		"bugfix #INC000000256379: Fix when region is missing.",
		"JS special includes. Use a promise for synch. (respect order of scripts).",
		"Merge branch 'master' of http://cde.toyota-europe.com/stash/scm/t1/t1-client into bugfix/js-special-includes",
		"JS special includes: use promise for synch.",
		"Merge pull request #979 in T1/t1-client from bugfix/js-special-includes to master* commit 'a5892d1cf6037e45100822f2feebc1e8147fd3d4':",
		"  bugfix #INC000000264470: js special includes (T1 script).",
		"Merge pull request #978 in T1/t1-client from change-request/new-comparers to master* commit 'db7a8686cbcc2ab826d063aca88c20764bef2198':",
		"  bugfix: Firefox issue with floating boxes model.",
		"Merge pull request #976 in T1/t1-client from bugfix/promo-content to master* commit '2d7b3bf2b5410ddce63cc1d8a3f4ee67c3c0aef5':",
		"  bugfix #INC000000270702:	W. Responsive layout issues mobile - promotion.	"	,
		"bugfix #INC000000264470: js special includes (T1 script).",
		"Merge branch 'master' of http://cde.toyota-europe.com/stash/scm/t1/t1-client into change-request/new-comparers",
		"bugfix: Firefox issue with floating boxes model.",
		"Merge pull request #977 in T1/t1-client from change-request/new-comparers to master* commit '31e246435bfb3d94b72c1b60ae0667fa3d3e95a1':",
		"  bugfix #INC000000256323: manage flag 'full'. Update: if no item in category, category is not added.",
		"Merge branch 'master' of http://cde.toyota-europe.com/stash/scm/t1/t1-client into bugfix/grades",
		"Integration : OSB : load url failoverBugfix : Hashing : discard empty querystring",
		"bugfix #INC000000256323: manage flag 'full'. Update: if no item in category, category is not added.",
		"Merge branch 'master' of http://cde.toyota-europe.com/stash/scm/t1/t1-client into bugfix/promo-content",
		"bugfix #INC000000270702:	W. Responsive layout issues mobile - promotion.	",
		"bugfix INC000000249544 : mainfocus : faster loading of the focus images (temp fix, until lazyload is implemented)",
		"change request: select the number of dealers displayed in the dealerfinder.",
		"Bugfix Jira_sidebar_CTA_redesign : CTA sidebar : Change colors cta-bar",
		"Change request: CTA bar: Changed background color of CTA text to red, fixed whitespace spaces to tabs",
		"change request: #INC000000236912: selection scope changed from 2-3 to 1-3.",
		"Bugfix INC000000283464 : 360 spin : 360 spin promoted car"
	]
};

$(document).ready(function() {
	'use strict';

	// Fix jquery ajax error No Transport for ie9 and lower
	jQuery.support.cors = true;

	var $window = $(window);
	var _debug = true;

	var startLoadTime = new Date().getTime();

	// Globalize
	window.globalize = {};

	if (Globalize) {
		var culture = T1.settings.culture;

		window.globalize = new Globalize(culture.name);
		window.globalize.cultures[culture.name] = culture;
	}

	//initialize all T1 components
	for (var sKey in T1) {
		//initialize if there is an init
		if (T1[sKey].init) {
			try {
			//	if(_debug){
				//	var d = new Date().getTime() - startLoadTime;
				//	console.log('LOADING ' + sKey + ' ' + d + ' milliseconds');
			//	}
				T1[sKey].init();
			} catch(e) {
				if (console.dir) {
					console.log(sKey);
					console.dir(e);
				} else {
					console.log('Error initializing ' + sKey + ': ' + e);
				}
			}
		}
	}

	//publish document click globally
	$(document).on("click touchstart", function(e){
		PubSub.publish(T1.constants.ON_DOC_CLICK, e);
	});
	//publish the key presses
	$(document).on("keypress", function(e){
		PubSub.publish(T1.constants.ON_KEY_PRESS, e);
	});
	//publish resize event globally
	$window.resize(function(e){
		PubSub.publish(T1.constants.ON_WIN_RESIZE, e);
	});
	// publish scroll event globally
	if (Modernizr.touch) {
		$window.bind('touchstart', function(e) {
			PubSub.publish(T1.constants.GLOBAL_SWIPE, e);
		});
	} else {
		$window.scroll(function(e) {
			PubSub.publish(T1.constants.GLOBAL_SCROLL, e);
		});
	}

	//run the first scroll tracking event (to capture the first lazyload images & visible sections)
	PubSub.publish(T1.constants.GLOBAL_SCROLL, {});

	//Modernizr cannot detect windows tablets/phones since they support only pointer events and emulates the touch events with pointer events
	//So we test and add the class touch class manually
	if(T1.utilities.iswindowsTablet()){
		$("html").removeClass("no-touch").addClass("touch");
	}
	//IE10 submits every possible forms on keydown enter. We either use keyup or prevent the default behaviour on IE10.
	if(T1.utilities.ieVersion() === 10){
		$("html").addClass("eq-ie10");
		$("input[type='text']").on("keydown", function(e){
			if(e.which === 13){
				e.preventDefault();
			}
		});
	}
	//We need this for Chrome or Safari only bugs
	if(T1.utilities.browser.isSafari || T1.utilities.browser.isChrome){
		$("html").addClass("opera-or-safari");
	}
});
