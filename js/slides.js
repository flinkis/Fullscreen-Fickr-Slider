(function($){
	$(document).ready(function() {
		$('body').prepend('<div id="supersized-loader"></div>').prepend('<div id="supersized"></div>');
	});
	$.slides = function( options ) {
		var settings = {
					slideshow: 1,
					slide_interval: 5000,	
					source:	2,
					set: '###',
					user:	'###',
					group: '###',
					tags: '###,###',
					total_slides:	100,
					image_size: 'z',
					sort_by: 1,
					api_key: '#############'
				},
				options = options ? $.extend(settings, options) : settings,
				
				doc = $(document),
				element = $('#supersized').hide(),

				inAnimation = false,
				slides = [{}],
				currentIndex = 0,				
				sort_order = '',
				flickrURL = '',
				slideshow_interval,
				flickerUrl = '',
				thinkers = [{}];

				buildSlide = function( index ){
					var loadPrev = index - 1 < 0  ? slides.length - 1 : index - 1,
							loadNext = index == slides.length - 1 ? 0 : index + 1;
					
					if (slides.length > 1){
						$("<div />").css("background-image", 'url(' + slides[loadPrev].image + ')').addClass('prevSlide').appendTo(element);
						$("<div />").css("background-image", 'url(' + slides[loadNext].image + ')').addClass('nextSlide').appendTo(element);
					}
					
					$("<div />").css("background-image", 'url(' + slides[index].image + ')').addClass('activeslide').appendTo(element);
					$('#slidecaption').html(slides[index].title);
				},
				buildDiv = function( index ){
					var prevThumb = index - 1 < 0  ? slides.length - 1 : index - 1,
							nextThumb = index == slides.length - 1 ? 0 : index + 1;
					
					if (slides.length > 1){
						$('#prevthumb').show().html($("<img/>").attr("src", slides[prevThumb].thumb));
						$('#nextthumb').show().html($("<img/>").attr("src", slides[nextThumb].thumb));
						
						$('#slidecounter .slidenumber').html(index + 1);	
						$('#slidecounter .totalslides').html(slides.length);
					}
					(slides[index].title) ? $('#slidecaption').html(slides[index].title) : $('#slidecaption').html('');
					$('#description').html('<p>' + slides[index].description + '</p>').css('background-image', 'url('+ thinkers[Math.floor(Math.random()*thinkers.length)].image +')').show();
					setTimeout(function(){ $('#description').fadeOut(); }, (options.slide_interval / 2));
				},
				nextslide = function( next ) {
					var next = typeof next !== 'undefined' ? next : true,
							currentslide = $('.activeslide').removeClass('activeslide'), //Find active slide
							nextslide = $('.nextSlide').removeClass('nextSlide'),
							prevslide = $('.prevSlide').removeClass('prevSlide'),
							loadNext,
							loadPrev;

					inAnimation = true;
					
					if( next ){
						currentIndex = currentIndex + 1 === slides.length ? 0 : currentIndex + 1;
						loadNext = currentIndex == slides.length - 1 ? 0 : currentIndex + 1;
						nextslide.addClass('activeslide');
						currentslide.addClass('prevSlide');
						prevslide.remove();
						$("<div />").css("background-image", 'url(' + slides[loadNext].image + ')').addClass('nextSlide').appendTo(element);
						
					} else {
						currentIndex = currentIndex == 0 ? slides.length -1 : currentIndex - 1;
						loadPrev = currentIndex - 1 < 0  ? slides.length - 1 : currentIndex - 1;
						prevslide.addClass('activeslide');
						currentslide.addClass('nextSlide');
						nextslide.remove();

						$("<div />").css("background-image", 'url(' + slides[loadPrev].image + ')').addClass('prevSlide').appendTo(element);
					}
					
					buildDiv(currentIndex);
					inAnimation = false;
				},			
				init = function(){
					$('#supersized-loader').hide(); //Hide loading animation
					
					/***Load initial set of images***/			
					buildSlide(currentIndex);
					buildDiv(currentIndex);
					
					element.fadeIn('fast'); //Fade in background
					$('#controls-wrapper').show(); //Display controls
					
					//Start slideshow
					slideshow_interval = setInterval(nextslide, options.slide_interval);	//Initiate slide interval
						
					//Next thumbnail clicked
					$('#nextthumb').on('click', function() {
						if(!inAnimation) {
							clearInterval(slideshow_interval); //Stop slideshow
							nextslide(); //Go to next slide
						}
					});
					
					//Previous thumbnail clicked
					$('#prevthumb').on('click', function() {
						if(!inAnimation) {
							clearInterval(slideshow_interval); //Stop slideshow
							nextslide(false); //Go to prev slide
						}
					});
				},
				
				fireDescriptionRequest = function(i) {
					return $.ajax({
					type: 'GET',
						async: true,
						url: 'http://api.flickr.com/services/rest/?&method=flickr.photos.getInfo&api_key=' + options.api_key + '&photo_id=' + slides[i].id + '&format=json&jsoncallback=?',
						dataType: 'json',
						success: function(data){
							slides[i].description = data.photo.description._content  ;
						}
					});
				},
				getDescription = function(){
					var dferredz = [];
					$.each(slides, function (i, k) { dferredz.push(fireDescriptionRequest(i)); });
					dferredz[dferredz.length - 1].done(function(){ doc.trigger('doneLoading'); });
				};
		
		switch(options.sort_by){
			case 1:
				sort_order = 'date-posted';
				break;
			case 2:
				sort_order = 'date-taken';
				break;
			case 3:
				sort_order = 'interestingness';
				break;
			default:
				sort_order = 'date-posted';
				break;
		}
		switch(options.source){
			case 1://From a Set
				flickrURL = 'http://api.flickr.com/services/rest/?&method=flickr.photosets.getPhotos&api_key=' + options.api_key + '&photoset_id=' + options.set + '&per_page=' + options.total_slides + '&sort=' + sort_order + '&format=json&jsoncallback=?';
				break;
			case 2://From a User
				flickrURL = 'http://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&api_key=' + options.api_key + '&user_id=' + options.user + '&per_page=' + options.total_slides + '&sort=' + sort_order + '&jsoncallback=?';
				break;
			case 3://From a Group
				flickrURL = 'http://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&api_key=' + options.api_key + '&group_id=' + options.group + '&per_page=' + options.total_slides + '&sort=' + sort_order + '&jsoncallback=?';
				break;
			case 4://From tags
				flickrURL = 'http://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&api_key=' + options.api_key + '&tags=' + options.tags + '&per_page=' + options.total_slides + '&sort=' + sort_order + '&jsoncallback=?';
				break;
		}
		
		$.ajax({
			type: 'GET',  
			url: flickrURL,
			dataType: 'json', 
			async: true,  
			success: function(data){
				var flickrResults = (options.source == 1) ? data.photoset.photo : data.photos.photo;
						
				//Build slides array from flickr request
				$.each(flickrResults, function(i,item){
						var photoURL = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_' + options.image_size + '.jpg',
								thumbURL = 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_t.jpg',
								photoLink = "http://www.flickr.com/photos/" + (data.photoset ? data.photoset.owner : item.owner) + "/" + item.id + "/";

							slides.push({ image : photoURL, thumb : thumbURL, title : item.title , url : photoLink, id : item.id });
				});
				slides.shift();
				doc.trigger('getThinkers');
			}
		});
		doc.on('getThinkers', function(){
			$.ajax({
				type: 'GET',  
				url: 'http://api.flickr.com/services/rest/?&method=flickr.photosets.getPhotos&api_key=' + options.api_key + '&photoset_id=72157638722890966&per_page=' + options.total_slides + '&sort=' + sort_order + '&format=json&jsoncallback=?',
				dataType: 'json', 
				async: true,  
				success: function(data){
					var flickrResults = data.photoset.photo;
							
					//Build slides array from flickr request
					$.each(flickrResults, function(i,item){
								thinkers.push({ image : 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_' + options.image_size + '.jpg' });
					});
					thinkers.shift();
					doc.trigger('getDescription');
				}
			});
		});
		doc.on('getDescription', getDescription);
		doc.on('doneLoading', init);
		
	};
})(jQuery);