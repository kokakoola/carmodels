/**
 * Created with JetBrains WebStorm.
 * User: Hendrik.De.Permentie
 * Date: 28/07/14
 * Time: 17:43
 * To change this template use File | Settings | File Templates.
 */
var T1 = T1 || {};

T1.carspin = ( function () {
	'use strict';

	var _private = {

		BASEURL_EXT: 'CCISHOST/vehicle/MODEL/CARID/width/800/height/400/scale-mode/1/padding/0,0,10,10/background-colour/fff/image-quality/70/MODE-ANGLE.EXTENTION',
		BASEURL_INT: 'CCISHOST/vehicle/MODEL/CARID/width/600/height/600/scale-mode/0/padding/0/background-colour/fff/image-quality/70/MODE-ANGLE.EXTENTION',
		SERVICE_URL: '/api/cardb/spin360/MODEL',
		extention: 'jpg',

		init: function(){
			PubSub.subscribe(T1.constants.CARSPIN_INIT, _private.loadCar);
			//lazyload the 360 spin
			PubSub.publish(T1.constants.SCROLL_TRACK_ADD,{elements:$('.carspin'), options:{once:true, event: T1.constants.CARSPIN_INIT}});
			//test the 360 spin
			//PubSub.publish(T1.constants.CARSPIN_INIT, {});
		},

		loadCar: function(msg, data){
			var m = _private,
			section = data.section || $('#carspin'),
			model = section.data('model') || 'aygo';

			if(section.length===0) return;

			$.ajax({
				url: m.SERVICE_URL.replace(/MODEL/g, model),
				dataType: 'json'
			}).done(function(data){
				m.loadCarData(section, data);
			});
		},

		loadCarData: function(section, data){

			var m = _private,
				grade = m.getGrade(data.subModels, (section.data('grade') || '')),
				gradeCarId = data.subModels[0].hasOwnProperty('promoted') ? data.subModels[0].promoted : grade.carId,
				settings = {
					CCISHost: T1.settings.CCISHost.replace(/\/$/g, '') || "http://t1-ccis.toyota-europe.com",
					model: data.code || 'auris',
					carId: gradeCarId || '46f33787-73da-44e6-ba99-f1668542da2a'
				};

			//++++ calculate the widths of the components
			var size = {},
				vw = window.innerWidth || $(window).innerWidth();
			if(vw <= T1.constants.SCREEN_SMALL){
				size.exterior = {width: 400, height: 210};
				size.interior = {width: 300, height: 300};
			}else if(vw <= T1.constants.SCREEN_MEDIUM){
				size.exterior = {width: 600, height: 315};
				size.interior = {width: 450, height: 450};
			}else{
				size.exterior = {width: 800, height: 420};
				size.interior = {width: 600, height: 600};
			}

			//++++ create the exterior 360 spin
			settings.mode = 'exterior';
			var spinExterior = section.find('.spin.exterior'),
				frames = $('<div></div>');
			spinExterior.css({
				height: Math.round(size.interior.height * 0.7) + 'px'
			});
			spinExterior.append(frames);

			//create 360 spin
			frames.spritespin({
				source: m.getImageUrls(settings),
				width: size.exterior.width,
				height: size.exterior.height,
				loop: false,
				stopFrame: 15,
				onLoad: function(){
					section.hideT1Loader();
				}
			});

			//++++ create the interior 360 spin
			settings.mode = 'interior';
			var spinInterior = section.find('.spin.interior');
			frames = $('<div></div>');
			spinInterior.css({
				height: Math.round(size.interior.height * 0.7) + 'px'
			});
			spinInterior.append(frames);

			frames.spritespin({
				source: m.getImageUrls(settings),
				width: size.interior.width,
				height: size.interior.height,
				loop: false,
				stopFrame: 0,
				onLoad: function(){
					section.hideT1Loader();
				}
			});
			frames.css({
				top: -(Math.round(size.interior.height * 0.3333333333)) + 'px'
			});

			//++++ show loader
			section.showT1Loader();

			//++++ activate the toggle button
			section.find('.toggle').click(m.toggleMode);

		},

		/*
		getSubModel: function(models, selection){
			var submodel = null;
			for(var iSubModel=0; iSubModel < models.length; iSubModel++){
				submodel = models[iSubModel];
				if(selection.toLowerCase()===submodel.name.toLowerCase()) return submodel;
			}
			return models[0];
		},*/

		getGrade: function(models, selection){
			var grade = null,
				grades = null;
			for(var iModel=0; iModel < models.length; iModel++){
				grades = models[iModel].grades;
				for(var iGrade=0; iGrade < grades.length; iGrade++){
					grade = grades[iGrade];
					if(selection.toLowerCase()===grade.code.toLowerCase()) return grade;
				}
			}
			return models[0].grades[0];
		},

		getImageUrls: function(data){
			var m = _private,
				isExterior = data.mode==="exterior",
				maxSlides = isExterior ? 32 : 3,
				baseUrl = isExterior ? m.BASEURL_EXT : m.BASEURL_INT,
				urls= [];

			//create image URLS
			var slide=null,
				url='',
				angle='';
			for(var iSlide=0; iSlide<=maxSlides; iSlide++){
				angle = iSlide;
				if(isExterior && (iSlide%2)) continue;
				urls.push(baseUrl.replace(/CCISHOST/g, data.CCISHost).replace(/COUNTRY/g, data.country).replace(/MODEL/g, data.model).replace(/CARID/g, data.carId).replace(/MODE/g, data.mode).replace(/ANGLE/g, angle).replace(/COLOR/g, data.color).replace(/EXTENTION/g, m.extention));
			}

			return urls;
		},

		toggleMode: function(e){
			var m = _private,
				spinContainers = $(e.target).closest('section').find('.spin');
			spinContainers.toggleClass('active');
		}

	};

	return {
		init: _private.init
	};

})();