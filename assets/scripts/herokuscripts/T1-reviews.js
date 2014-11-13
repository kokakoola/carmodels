var T1 = T1 || {};

/**
 *	reviews: Used to make star-reviews what they're supposed to be
 *	** This component appreciates a .car-model class and a data-car-model="model_name" to work and get Ratings
 *	** It also appreciates a .review-auto-fill where the Owner reviews are supposed to fall or it will never show Owner Reviews
 */

T1.reviews = (function () {
	'use strict';

	var _private = {
		revCar: $('.car-model').attr('data-car-model'),
		bvAPI: null,
		allRevs: [],
		avgRating: 0,
		secRatingAvgs: {},
		textValues:{},
		starsPromo: $('.review-summary-promo, .big-rating'),
		revAutoFill: $('.review-auto-fill'),
		driversReviewsLoadedFromBazar: false,
		isMobile: false,

		init: function(){
			_private.bvAPI = T1.settings.bazaarVoiceJsonLink;
			var m = _private,
				limitFill = false,
				fillPromoStars = false;

			// get label values
			if(!T1.labels){
				T1.labels={};
			}
			m.textValues = {
				by: (T1.labels) ? T1.labels.by : '',
				timestamp_separator: (T1.labels) ? T1.labels.on : '',
				read_more: (T1.labels) ? T1.labels.readMore : '',
				outOf: T1.labels.reviews.outOfFive,
				aged: (T1.labels) ? T1.labels.reviews.age : '',
				byPoster: (T1.labels) ? T1.labels.reviews.by : '',
				from: (T1.labels) ? T1.labels.reviews.from : '',
				gender: (T1.labels) ? T1.labels.reviews.gender : '',
				new_review: T1.labels.reviews['new'],
				OverallRating: T1.labels.reviews.OverallRating,
				feedback: T1.labels.reviews.feedback,
				feedbackPos: (T1.labels) ? T1.labels.yes : '',
				feedbackNeg: (T1.labels) ? T1.labels.no : '',
				feedbackVoteSuccess: T1.labels.reviews.voteSuccess,
				feedbackVoteFailure: T1.labels.reviews.voteFailure,
				feedbackReport: T1.labels.reviews.report,
				feedbackReported: T1.labels.reviews.reported,
				recommend: T1.labels.reviews.recommend,
				reviewsPageName: T1.labels.reviews.pageName,
				alreadyVoted: T1.labels.reviews.alreadyVoted,
				createnewrev: T1.labels.reviews.createNew
			};

			// subscribe events
			PubSub.subscribe(T1.constants.REVIEW_AVARAGE_RATING, m.setStars);
			PubSub.subscribe(T1.constants.REVIEW_LOADBAZAR, m.loadBazar);
			PubSub.subscribe(T1.constants.REVIEW_SEE_REVIEWS, m.seeReviews);
			PubSub.subscribe(T1.constants.REVIEW_OPENREVIEWS, m.openReviews);
			// PubSub.subscribe(T1.constants.REVIEW_FEEDBACK_CLICK, m.sendFeedback);
			PubSub.subscribe(T1.constants.REVIEW_GETREVFORM, m.getReviewForm);

			if (m.revCar) {
				if (m.bvAPI) {
					m.bvAPI = m.bvAPI.replace(/<id>/g, m.revCar);

					var revAutoFill = (m.revAutoFill.length > 0);
					if (revAutoFill) limitFill = (m.revAutoFill.attr('data-limit-reviews')) ? m.revAutoFill.attr('data-limit-reviews') : false ;
					if (m.starsPromo.length > 0) fillPromoStars = true;
					else {
						var bigRating = $('.big-rating');
						if (bigRating.length > 0) {
							fillPromoStars = true;
							m.starsPromo = bigRating;
						}
					}
					m.loadBazarVoiceApi();
					PubSub.publish(T1.constants.REVIEW_LOADBAZAR, {setStars:fillPromoStars,autoFill:revAutoFill,limitReviews: limitFill});
				}
			}
		},
		switchDesktop: function() {
			var m = _private;
			m.isMobile = false;
		},
		switchMobile: function() {
			var m = _private;
			m.isMobile = true;
		},
		initDesktop: function() {
			var m = _private;
			m.isMobile = false;
		},
		initMobile: function() {
			var m = _private;
			m.isMobile = true;
		},
		loadBazarVoiceApi: function() {
			var bvapiURL = T1.settings.bazaarVoiceApiLink;
			if (bvapiURL.length > 0) {
				window.loadBazaarvoiceApi = function(callback) {
					if (window.$BV) {
						callback();
					} else {
						$.ajax({
							url: bvapiURL,
							cache: true,
							dataType: "script",
							success: function() {
								$($BV.docReady);
								callback();
							}
						});
					}
				};
			}
		},
		loadBazar: function (evName, data) {
			var m = _private,
				secRatingDummy = null,
				jsonData = $.getJSON(m.bvAPI, function(json) {
					var Products = json.Includes.Products,
						Reviews = json.Results;
					if (typeof Products !== 'undefined') {
						m.secRatingAvgs = Products[Object.keys(Products)[0]].ReviewStatistics.SecondaryRatingsAverages;
						m.avgRating = Products[Object.keys(Products)[0]].ReviewStatistics.AverageOverallRating;
						if (data.setStars) PubSub.publish(T1.constants.REVIEW_AVARAGE_RATING, m.avgRating);
						$.each(Reviews, function(key,val) {
							//only grab the needed data
							var currentRev = {};
							if(val.Title) currentRev.title = val.Title;
							if(val.Rating) currentRev.rating = val.Rating;
							if(val.UserNickname) currentRev.nickname = val.UserNickname;
							if(val.SubmissionTime) currentRev.timestamp = val.SubmissionTime;
							if(val.Id) currentRev.id = val.Id;
							if(val.ReviewText) {
								currentRev.text = val.ReviewText;
								if (currentRev.text.length > 350) {
									currentRev.text = val.ReviewText.slice(0,346);
									currentRev.text = currentRev.text+' ...';
								}
							}
							if(val.IsRecommended) currentRev.recommended = val.IsRecommended;
							if(val.ContextDataValues){
								if(val.ContextDataValues.Age) currentRev.aged = val.ContextDataValues.Age.ValueLabel;
								if(val.ContextDataValues.LengthOfOwnership) currentRev.ownerlength = val.ContextDataValues.LengthOfOwnership.ValueLabel;
								if(val.ContextDataValues.Gender) currentRev.gender = val.ContextDataValues.Gender.ValueLabel;
								if(val.ContextDataValues.DriverType) currentRev.driver = val.ContextDataValues.DriverType.ValueLabel;
							}
							if(val.SecondaryRatings) currentRev.secratings = val.SecondaryRatings;
							if(val.TotalPositiveFeedbackCount) currentRev.feedbackpositive = val.TotalPositiveFeedbackCount;
							if(val.TotalNegativeFeedbackCount) currentRev.feedbacknegative = val.TotalNegativeFeedbackCount;
							//if no ratings are entered -> use an empty dummy object
							if (Object.keys(currentRev.secratings).length === 0) {
								if(!secRatingDummy){
									secRatingDummy = $.extend(true,{},m.secRatingAvgs);
									$.each(secRatingDummy, function(sKey) {
										secRatingDummy[sKey].AverageRating = 0;
									});
								}
								currentRev.secratings = secRatingDummy;
							}
							m.allRevs.push(currentRev);
						});
						if (data.autoFill === true) m.seeReviews('byHand',{limitReviews: data.limitReviews});
					}
					else {
						m.avgRating = 0;
						if (data.setStars) PubSub.publish(T1.constants.REVIEW_AVARAGE_RATING, m.avgRating);
					}
				});
		},
		getReviewForm: function(evName,data) {
			var m = _private,
				bvapiUrl = T1.settings.bazaarVoiceApiLink,
				pagename = m.textValues.reviewsPageName,
				inpageArg = false;
			if (bvapiUrl) {
				var _object = {
						productId: m.revCar,
						doShowSubmission: function() {
							if (m.isMobile) inpageArg = true;
							PubSub.publishSync(T1.constants.PAGEOVERLAYER_DESTROY,{});
							PubSub.publishSync(T1.constants.PAGEOVERLAYER_OPEN,{html:$('<div id="BVSubmissionContainer" class="container"></div>'),styleClass:'rev-show',pageName:pagename,inPage:inpageArg});
						},
						allowSamePageSubmission: true
					};
				if (m.isMobile) _object.displayType = "mobile";
				loadBazaarvoiceApi(function() {
					$BV.ui("rr", "submit_review", _object);
				});
			}
		},
		openReviews: function () {
			var m = _private,
				reviewsPlace = '<div class="review reviews-full container"></div>',
				section = $('.review'),
				pagename = m.textValues.reviewsPageName,
				inpageArg = false;

			var _object = {
					productId: m.revCar,
					onSubmissionReturn: function() {
						PubSub.publish(T1.constants.TOAST_CUSTOM, {
							customContainer : $("body"),
							customText      : T1.labels.reviews.submissionReturn,
							timeout         : 2000,
							centerScreen    : true
						});
					},
					onEvent: function(json) {
						if(json.eventSource == 'Display') {
							$('#BVRRDisplayContentLinkWriteID a').removeAttr('onclick').removeAttr('data-bvjsref').click(function() {
								PubSub.publish(T1.constants.REVIEW_GETREVFORM, {});
								m.driversReviewsLoadedFromBazar = true;
							});
							$('.overlayerContent').find('#BVRRContainer').parent().removeClass("rev-hide");
						}
					}
				};

			if (m.isMobile) _object.displayType = "mobile";
			if ($('#BVRRContainer').length < 1) {
				$('body').append($('<div class="rev-hide"><div id="BVRRContainer" class="container"></div></div>'));
			}
			if (m.driversReviewsLoadedFromBazar === false) {
				loadBazaarvoiceApi(function() {
					$BV.ui("rr", "show_reviews", _object);
				});
			}
			if (_object.displayType == "mobile") inpageArg = true;
			PubSub.publish(T1.constants.PAGEOVERLAYER_OPEN,{html:$('#BVRRContainer'),styleClass:'rev-show',pageName:pagename,preserveContent: true,inPage:inpageArg});
		},
		seeReviews: function(evName, data) {
			var m = _private,
				limitReviews = false,
				ratingSummary = $('.reviews-summary'),
				reviewsPlace = (m.revAutoFill.length > 0) ? m.revAutoFill : false,
				usingClass = 'col-xs-12 col-sm-4 col-md-4 col-lg-4',
				fullReviewPage = false,
				topPageRatingFilled = ($('.review-avg-rating').length > 0) ? true : false;
			// create a dummy div to hold the review
			var dummyDiv = $(
					'<div class="'+usingClass+'">' +
						'<h5 class="review-title"></h5>'+
						'<h5 class="review-recommended rev-hide"></h5>'+
						'<div class="progress star-gray">'+
							'<div class="progress-bar star-yellow star" role="progressbar"></div>'+
						'</div>'+
						'<div class="review-container"></div>'+
						'<div class="review-details">'+
							'<a href="#/publish/review_openreviews" data-bt-track="" class="read-more"></a>'+
							'<div class="poster-name"></div>'+
						'</div>'+
					'</div>'
				);

			if (ratingSummary.length > 0) {
				// if There is a review-summary (like in poc-reviews) populate those with the various ratings in m.SecRatingAvg
				if (m.secRatingAvgs) {
					var dummySecStars = $(
						'<div class="col-xs-6 col-sm-12">'+
							'<h5></h5>'+
							'<div class="progress star-gray">'+
							'	<div class="progress-bar star-yellow star" role="progressbar"></div>'+
							'</div>'+
							'</div>'
					);
					if (ratingSummary.children().length < Object.keys(m.secRatingAvgs).length+1) {
						// check if ratingSummary already has the content in it and populate only if not
						$.each(m.secRatingAvgs, function(key,val) {
							var clonedSecStars = dummySecStars.clone(),
								starScale = ((Math.floor(val.AverageRating)*2)*10)/100*100;
							$('h5',clonedSecStars).text(key);
							$('.star',clonedSecStars).css({width:starScale+'%'});
							ratingSummary.append(clonedSecStars);
						});
					}
				}
			}
			if (!isNaN(parseFloat(data.limitReviews))) limitReviews = data.limitReviews-1;
			$.each(m.allRevs, function(key,val) {

				var clonedDiv = dummyDiv.clone(),
					starScale = ((Math.floor(val.rating)*2)*10)/100*100;
				if (limitReviews) {
					if (key > limitReviews) return;
				}

				$('.review-title',clonedDiv).text(val.title);
				if (val.recommended) $('.review-recommended',clonedDiv).text(m.textValues.recommend).removeClass("rev-hide");
				$('.star',clonedDiv).css({width:starScale+'%'});
				$('.review-container',clonedDiv).text(val.text);
				//var string = m.textValues.byNameDate.replace('{name}',val.nickname).replace('{date}',val.timestamp.replace(/T.*/g,''));
				var string = m.textValues.by + ' ' + val.nickname + ' ' + m.textValues.timestamp_separator + ' ' + val.timestamp.replace(/T.*/g,'');
				$('.poster-name',clonedDiv).text(string);
				if(!fullReviewPage) $('.read-more',clonedDiv).text(m.textValues.read_more);

				reviewsPlace.append(clonedDiv);
			});
			//PubSub.publish(T1.constants.STATS_INIT_TRACK, {target: reviewsPlace});
		},
		setAvgRating: function (ratingPlace) {
			var m = _private,
				ratingStars = $('<div class="col-xs-12"><h5 class="review-sec-rating-label">'+ m.textValues.OverallRating+'</h5><div class="progress star-gray"><div class="progress-bar star-yellow star" role="progressbar"></div></div></div>'),
				star = $('.star',ratingStars),
				starProgress = ((Math.floor(m.avgRating)*2)*10)/100*100;
			star.css({width:starProgress});
			ratingStars.appendTo(ratingPlace);
			return ratingPlace;
		},
		/**
		 * set Secondary Average Rating
		 * @param ratingPlace the DOM element that's supposed for the stars to appear
		 * @returns {*}
		 */
		setSecAvgRating: function(ratingPlace) {
			var m = _private;
			if (Object.keys(m.secRatingAvgs).length > 0) {
				var dummySecStars = $(
					'<div class="col-xs-3 col-sm-3 col-xs-center">'+
						'<h5></h5>'+
						'<div class="progress star-gray">'+
						'	<div class="progress-bar star-yellow star" role="progressbar"></div>'+
						'</div>'+
						'</div>'
				);
				$.each(m.secRatingAvgs, function(key,val) {
					var clonedSecStars = dummySecStars.clone(),
						starScale = ((Math.floor(val.AverageRating)*2)*10)/100*100;
					$('h5',clonedSecStars).text(key);
					$('.star',clonedSecStars).css({width:starScale+'%'});
					ratingPlace.append(clonedSecStars);
				});
			}
			return ratingPlace;
		},
		/**
		 * sets stars and text on review-summary
		 * @param evName (String) event Name
		 * @param avgRating (Integer) number of stars, max value is 5
		 */
		setStars: function(evName, avgRating) {
			var m = _private,
				avgRatingZone = false;
			if (!m.avgRating) m.avgRating = 0;
			if (m.starsPromo.length > 0) avgRatingZone = m.starsPromo;
			if (avgRatingZone !== false) {
				var promoStar = avgRatingZone.find('.star, .bigStar'),
					starProgress = ((avgRating*2)*10)/100*100,
					ratingText = promoStar.parent().parent().find('.rating-text');
				promoStar.css({width:starProgress+'%'});
				if (m.avgRating > 0) {
					if (ratingText) {
						var tempRating = avgRating.toFixed(2).toString().replace(".", ",");
						ratingText.text(tempRating+' '+ m.textValues.outOf);
					}
				}
				else {
					ratingText.text('');
					ratingText.parent().find('a').text(m.textValues.createnewrev).attr('href','#/publish/review_getrevform');
				}
			}
		}
	};

	return {
		init: _private.init,
		initMobile: _private.initMobile,
		initDesktop: _private.initDesktop,
		switchDesktop: _private.switchDesktop,
		switchMobile: _private.switchMobile
	};
}());
