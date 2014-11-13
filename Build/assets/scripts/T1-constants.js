/*
 * T1-constants.js 0.5
 * KGH: reorganize
 * KGH: add navigation event
 */
var T1 = T1 || {};

/**
 *	constants
 */
T1.constants = ( function() {
	'use strict';

	return {
		// global event names ---------------------------------------
		ON_DOC_CLICK			: 'onDocumentClick',
		ON_KEY_PRESS			: 'onKeyPress',
		ON_WIN_RESIZE			: 'onWindowResize',
		ON_BREAKPOINT_CHANGE	: 'onBreakpointChange',
		GET_BREAKING_POINT		: 'returnBreakPoint',

		GLOBAL_SCROLL						: 'scroll',
		GLOBAL_SWIPE						: 'swipe',

		// script paths ---------------------------------------------
		JS_VIDEOJS		: '/external.scripts/video.min.js',

		// class names ----------------------------------------------
		CLASS_ACTIVE			: 'active',
		CLASS_CARCHAPTER		: 'car-chapter',
		CLASS_ERROR				: 'error',
		CLASS_ERROR_FORM		: 'error-form',

		// URLs -----------------------------------------------------
		URI_MINI_CARCONFIG_DATA						: '/api/cardb/minicarconfig/',
		URL_MINI_CARCONFIG_IMG						: 'vehicle/[MODEL]/[GRADE]/exterior-32_[COLOUR].png',
		URL_GOOGLE_MAPS_API							: 'https://maps.googleapis.com/maps/api/js?client={CLIENT_ID}&sensor=false&v=3.14',
		URL_GOOGLE_MAPS_API_DEV						: 'https://maps.googleapis.com/maps/api/js?key={API_KEY}&sensor=false&v=3.14',
		URL_GOOGLE_STATIC_MAPS_API					: 'http://maps.google.com/maps/api/staticmap?client={CLIENT_ID}',
		URL_GOOGLE_STATIC_MAPS_API_DEV				: 'http://maps.google.com/maps/api/staticmap?key={API_KEY}',
		URL_SUBMIT_FORM_CONTACT						: '/api/feedback/contact',
		URL_SUBMIT_FORM_CONTACT_DEALER				: '/api/feedback/contact',
		URL_SUBMIT_FORM_BROCHURE					: '/api/feedback/brochure',
		URL_SUBMIT_FORM_TESTDRIVE					: '/api/feedback/testdrive',
		URL_SUBMIT_FORM_MY_TOYOTA_LOGIN				: '/api/user/login',
		URL_SUBMIT_FORM_MY_TOYOTA_SEARCH_CAR		: '/config',
		URL_SUBMIT_FORM_MY_TOYOTA_SAVE_CAR			: '/api/user/save',
		URL_SUBMIT_FORM_MY_TOYOTA_SAVE_DEALER		: '/api/user/save',
		URL_SUBMIT_FORM_MY_TOYOTA_REGISTER			: '/api/user/create',
		URL_SUBMIT_FORM_MY_TOYOTA_PASSWORD			: '/api/user/reset',
		URL_SUBMIT_FORM_MY_TOYOTA_RESET_PASSWORD	: '/api/user/reset-password',
		URL_MY_TOYOTA_DELETE_CAR					: '/api/user/save',
		URL_MY_TOYOTA_DELETE_DEALER					: '/api/user/save',
		URL_MY_TOYOTA_CONFIG						: '/config/toyota',
		URL_DEALERS									: '/api/dealer',
		URL_DEALERS_ALL								: '/api/dealers/all',
		URL_DEALERS_NEAR							: '/api/dealer/nearest/',
		URL_DEALERS_DRIVE							: '/api/dealer/drive/',
		URL_DEALERS_REGIONS							: '/api/dealer/regions',
		URL_DEALERS_CITIES							: '/api/dealer/cities',
		URL_DEALERS_LOCAL							: '/api/dealers/local/',
		URL_DEALERS_REGIONAL						: '/api/dealers/regional/',
		URL_CAR_CONFIG_OVERLAYER					: '/publish/CARCONFIG_LOAD/',

		// animation speeds -----------------------------------------
		ANIMATION_SPEED_FADE: 666,
		ANIMATION_SPEED_SCROLL: 666,

		// media queries --------------------------------------------
		SCREEN_XTRASMALL	: 480,
		SCREEN_SMALL		: 768,
		SCREEN_MEDIUM		: 992,
		SCREEN_LARGE		: 1200,

		// sizes ----------------------------------------------------
		PAGEOVERLAYER_TOOLBARWIDTH	: 73,

		// hashes
		HASH_ADD		: 'onHashAdd',
		HASH_REMOVE		: 'onHashRemove',
		HASH_CHANGE		: 'onHashChange',
		HASH_REPLACE    : 'onHashReplace',
		HASH_REWRITE    : 'onHashRewrite',

		// mobile events
		MODE_SWITCH_MOBILE		: 'onSwitchMobile',
		MODE_SWITCH_DESKTOP		: 'onSwitchDesktop',
		MODE_INIT_MOBILE		: 'onInitDesktop',
		MODE_INIT_DESKTOP		: 'onInitDesktop',
		MOBILE_OPEN				: 'onMobileOpen',

		// lazy load events
		LAZY_LOAD				: 'onLazyLoad',

		//SKROLLR
		SKROLLR_REFRESH			: 'onSkrollrRefresh',

		// statistics tracking categories ---------------------------
		STATS_CATEGORY_PAGE			: 'page',
		STATS_CATEGORY_MODEL		: 'model',
		STATS_CATEGORY_EVENT		: 'event',
		STATS_CATEGORY_COMPONENT	: 'component',
		STATS_ACTION_SCROLL			: 'scroll',
		STATS_ACTION_COLLAPSE		: 'collapse',
		STATS_ACTION_EXPAND			: 'expand',
		STATS_ACTION_CLICK			: 'click',
		STATS_TRACK_SECTIONSCROLL	: 'sectionScroll',
		STATS_TRACK					: 'onTrack',
		STATS_TRACK_CAROUSEL		: 'onTrackCarousel',
		//STATS_INIT_TRACK			: 'statsTrackAdd',

		// form validation categories
		FORM_VALIDATION_RULE_SELECT			: 'select',
		FORM_VALIDATION_RULE_LENGTH			: 'length',
		FORM_VALIDATION_RULE_NUMBER			: 'number',
		FORM_VALIDATION_RULE_EMAIL			: 'email',
		FORM_VALIDATION_RULE_PHONE			: 'phone',
		FORM_VALIDATION_RULE_PARITY			: 'parity',
		FORM_VALIDATION_RULE_REGEXP			: 'regexp',

		// cta types
		CTA_TYPES: {
			DOWNLOAD		: 'download',
			FINANCE			: 'finance',
			LOAD			: 'load',
			PRINT			: 'print',
			SAVE			: 'save',
			SEND			: 'send',
			TESTDRIVE		: 'testdrive',
			DEALERFINDER	: 'dealerfinder',
			CUSTOM			: 'custom'
		},

		CARCONFIG_STEPS: {
			MODEL			: 'models',
			BODY			: 'bodyType',
			ENGINE			: 'engine',
			TRANSMISSION	: 'transmission',
			WHEELDRIVE		: 'wheelDrives',
			GRADE			: 'grades',
			COLOUR			: 'colours'
		},

		//cross domain form posts
		FORM_CROSS_DOMAIN_POST				: 'onFormCrossDomainPost',
		FORM_CROSS_DOMAIN_PAGE_READY		: 'onPageReadyCrossDomainRequest',

		TOAST_CUSTOM				: 'customToastEvent',

		// keycode --------------------------------------------------
		KEYCODE_LEFT	: 37,
		KEYCODE_UP		: 38,
		KEYCODE_RIGHT	: 39,
		KEYCODE_DOWN	: 40,
		KEYCODE_ESC		: 27,

		// pubsub event constants -----------------------------------
		// ONLY PUT EVENTS HERE!!!
		GALLERY_ITEM_CLICK				: 'onGalleryItemClick',
		GALLERY_MOBILE_BUILD			: 'onGalleryMobileBuild',
		GALLERY_SCROLL					: 'onGalleryScroll',
		MEDIAOVERLAYER_HIDE				: 'onMediaOverLayerHide',
		MEDIAOVERLAYER_VIDEO_CLICK		: 'onMediaOverlayerVideoClick',
		IFRAME_DESTROY					: 'onIframeSlid',

		OTHER_FEATURES_CLICK			: 'onOtherFeaturesClick',
		OTHER_FEATURES_SHOWALL			: 'otherFeaturesShowAll',

		VIDEO_CLICK				: 'onVideoClick',
		VIDEO_STOP				: 'onVideoStop',
		VIDEO_CREATEPLAYER		: 'onVideoCreatePlayer',
		VIDEO_CREATEDPLAYER		: 'onVideoCreatedPlayer',
		VIDEO_RESET				: 'onVideoReset',

		CAROUSEL_CREATE			: 'onCarouselCreate',
		CAROUSEL_CREATED		: 'onCarouselCreated',
		CAROUSEL_INITIALIZE		: 'onCarouselInitialize',
		CAROUSEL_EXPAND			: 'onCarouselExpand',
		CAROUSEL_SLIDE			: 'onCarouselSlide',

		CAROUSEL_CREATERESPONSIVE	: 'onCarouselCreateResponsive',
		CAROUSEL_RESONSIVECREATED	: 'onCarouselCreatedResponsive',

		PAGEOVERLAYER_OPEN					: 'pageOverlayerOpen',
		PAGEOVERLAYER_LOAD					: 'pageOverlayerLoaded',
		PAGEOVERLAYER_CLOSE					: 'pageOverlayerClose',
		PAGEOVERLAYER_CLOSED				: 'pageOverlayerClosed',
		PAGEOVERLAYER_REOPEN_MAINCONTENT	: 'pageOverlayerReopenMain',
		PAGEOVERLAYER_RESIZE_IMAGE			: 'pageOverlayerResizeImage',
		PAGEOVERLAYER_RESIZE				: 'pageOverlayerResize',
		PAGEOVERLAYER_DESTROY				: 'pageOverlayerDestory',

		PAGE_INITIALIZED					: 'pageInitialized',

		SEARCH								: 'onSearch',
		FULL_SEARCH							: 'onFullSearch',

		READMORE_SHOW						: 'onShowReadMore',
		READMORE_HIDE						: 'onHideReadMore',
		READMORE_HIDE_SELECTED				: 'onHideSelectedReadMore',

		CARSPIN_INIT						: 'onCarspinInit',

		EXPANDITEMSBUTTON_CLICK				: 'onExpandItemsButtonClicked',


		SCROLL_TRACK_ADD					: 'onScrollTrackAddElements',
		SCROLL_TRACK_APPEAR					: 'onScrollTrackAppear',

		FIGURE_LOAD							: 'figureLoaded',

		IFRAME_LOAD							: 'iframeLoaded',
		IFRAME_REQUEST						: 'iframeRequested',

		SPOTLIGHTS_CLICK					: 'spotlightClicked',

		NAVIGATION_PRIMARY_EXPAND			: 'navigationPrimaryExpand',
		NAVIGATION_PRIMARY_COLLAPSE			: 'navigationPrimaryCollapse',
		NAVIGATION_SET_SCROLLTO				: 'navigationSetScrollTo',
		NAVIGATION_ADD_BREADCRUMB_LINK		: 'navigationAddBreadcrumbLink',
		NAVIGATION_REMOVE_BREADCRUMB_LINK	: 'navigationRemoveBreadcrumbLink',

		REVIEW_BUTTON_CLICKED				: 'reviewsButtonClicked',

		ENGINE_COMPARE_CHANGE				: 'engineCompareEdit',
		ENGINE_COMPARE_PRINT				: 'engineComparePrint',
		MODEL_COMPARE_CHANGE				: 'modelCompareEdit',
		MODEL_COMPARE_PRINT					: 'modelComparePrint',
		MOBILE_COMPARE_CHANGE				: 'mobileCompareChange',
		MOBILE_COMPARE_MODELS_CHANGE		: 'mobileCompareModelsChange',

		COMPARE_ENGINES						: 'compareEngines',
		COMPARE_MODELS						: 'compareModels',
		COMPARE_PACKS						: 'comparePacks',

		REVIEW_AVARAGE_RATING				: 'reviewRatingArrived',
		REVIEW_LOADBAZAR					: 'loadBazarEvent',
		REVIEW_OPENREVIEWS					: 'openOverlayerWithReviews',
		REVIEW_SEE_REVIEWS					: 'loadFirstThreeReviews',
		REVIEW_FEEDBACK_CLICK				: 'clickedOnFeedbackButtons',
		REVIEW_GETREVFORM					: 'getReviewForm',

		// carconfig && carconfig mini
		CARCONFIG_LOAD						: 'ccLoad',
		CARCONFIG_END						: 'ccEnd',
		CARCONFIG_SAVE_CONFIG				: 'ccSaveConfig',
		CARCONFIG_LOAD_CONFIG				: 'ccLoadConfig',
		CARCONFIG_MINI_LOAD					: 'ccMiniLoad',
		CARCONFIG_MINI_END					: 'ccMiniEnd',
		CARCONFIG_MINI_INIT					: 'ccMiniInit',
		OVERLAY_READY						: 'overlayReady',

		FORM_LOAD							: 'formLoad',
		FORM_ERROR							: 'formError',
		FORM_VALIDATION_FAILED				: 'formValidationFailed',
		TABS_LOAD							: 'tabsLoad',
		TABS_SWITCH							: 'tabSwitch',
		DEALER_LOAD							: 'dealerLoad',
		DEALER_SAVE							: 'dealerSave',
		DEALER_SELECTED						: 'dealerSelected',
		DEALERS_FOUND						: 'dealersFound',

		BEFORE_FORM_SUBMIT					: 'beforeFormSubmit',
		SUBMIT_FORM_RETURN					: 'submitFormReturn',
		VALIDATE_FORM_RETURN				: 'validateFormReturn',

		EPRIVACY_AUTO_APPROVED				: 'ePrivacyAutoApproved',
		EPRIVACY_CANCELED					: 'ePrivacyCanceled',
		EPRIVACY_OPEN						: 'ePrivacyOpen',
		EPRIVACY_SAVED						: 'ePrivacySaved',
		EPRIVACY_LOAD_COMPONENT				: 'ePrivacyLoadComponent',
		EPRIVACY_COOKIE_NAME				: $('head').data('eprivacy-cookie') || 'TmeEPrivacy',

		MY_TOYOTA_MY_CARS					: 'MyToyotaMyCars',
		MY_TOYOTA_MY_DEALERS				: 'MyToyotaMyDealers',
		MY_TOYOTA_OWNERS_AREA				: 'MyToyotaOwnersArea',
		MY_TOYOTA_LOGIN						: 'MyToyotaLogin',
		MY_TOYOTA_LOGIN_SUCCESS				: 'MyToyotaLoginSuccess',
		MY_TOYOTA_LOGIN_FAIL				: 'MyToyotaLoginFail',
		MY_TOYOTA_CANCEL_LOGIN				: 'MyToyotaCancelLogin',
		MY_TOYOTA_REGISTER					: 'MyToyotaRegister',
		MY_TOYOTA_FORGOTTEN_PASSWORD		: 'MyToyotaForgottenPassword',
		MY_TOYOTA_RESET_PASSWORD			: 'MyToyotaSetPassword',
		MY_TOYOTA_HASH_PASSWORD				: 'MyToyotaHashPassword',
		MY_TOYOTA_SAVE_CAR					: 'MyToyotaSaveCar',
		MY_TOYOTA_SAVED_CAR					: 'MyToyotaSavedCar',
		MY_TOYOTA_STORED_CAR				: 'MyToyotaStoredCar',
		MY_TOYOTA_GET_CAR					: 'MyToyotaGetCar',
		MY_TOYOTA_SAVED_DEALER				: 'MyToyotaSavedDealer',
		MY_TOYOTA_SAVE_DEALER_FAILED		: 'MyToyotaSaveDealerFailed',
		MY_TOYOTA_DEALER_ALREADY_SAVED		: 'MyToyotaDealerAlreadySaved',
		MY_TOYOTA_TAB_SWITCH				: 'MyToyotaTabSwitch',
		MY_TOYOTA_SEARCH_FAILED				: 'MyToyotaSearchNoResult',
		MY_TOYOTA_SEARCH_FOUND				: 'MyToyotaSearchFound',
		MY_TOYOTA_CAR_ALREADY_SAVED			: 'MyToyotaCarAlreadySaved',
		MY_TOYOTA_DISPLAYED_SAVED_CARS		: 6,

		SOCIAL_SHARED						: 'socialSharedLink',
		SOCIAL_SHARE_INIT					: 'socialShareInit',

		ACCESSORIES_FILTER_CLICKED			: 'accessoriesFilterClicked',
		ACCESSORIES_INTERACTION_VIEWALL		: 'accessoriesOverlayInteraction',
		ACCESSORIES_TABBTN_CLICKED			: 'accessoriesTabsClicked',
		ACCESSORIES_SWITCHVIEW				: 'accessoriesSwitchView',

		FINANCE_RATES_ON					: 'enableFinanceRates',
		FINANCE_RATES_OFF					: 'disbaleFinanceRates',
		FINANCE_RATES_LOADED				: 'financeRatesLoaded',
		FINANCE_RATES_COOKIE_NAME			: 'financeRates',
		FINANCE_EXTERNAL_POST_REQUEST		: 'financeExternalPostRequest',
		INSURANCE_EXTERNAL_POST_REQUEST		: 'insuranceExternalPostRequest',
		FINANCE_CONFIG						: 'financeConfig',

		GOOGLE_MAP_LOAD					: 'googleMapLoad',

		SECTION_HOMEPAGE_CHILD_PAGES						: '/api/content',
		SECTION_HOMEPAGE_CHILD_NUM_BIG_OPTIONS				: 4,
		SECTION_HOMEPAGE_CHILD_FILTERING_COUNT				: 4,
		SECTION_HOMEPAGE_CHILD_FILTERING_COUNT_NEW_FILTER	: 12,
		SECTION_HOMEPAGE_CHILD_FILTERING_PROMOS				: 'false',
		SECTION_HOMEPAGE_CHILD_FILTERING_REQ_TIMEOUT		: 5000,
		SECTION_HOMEPAGE_CHILD_VISIBLE_SMALL_OPTIONS		: 4,
		SECTION_HOMEPAGE_CHILD_SHOW_MORE_OPTIONS			: 4,
		SECTION_HOMEPAGE_CHILD_SHOW_MORE_OPTIONS_SM			: 3,
		SECTION_HOMEPAGE_CHILD_SHOW_MORE_OPTIONS_XS			: 2,

		//EVENTS RELATED TO THE CALCULATION OF IMAGES VISIBLE AREA
		CALCULATE_VISIBLE_AREA_OF_THE_IMAGE					: "getVisibleAreaOfImage",

		// CAR DB
		DEFAULT_EXTERIOR_VIEW	: "exterior-32.png",
		MISSING_IMAGE			: "ty-missing-image.jpg"
	};
}());