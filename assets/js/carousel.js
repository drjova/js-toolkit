(function($){

    $.carousel = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("carousel", base);

        base.init = function(){
            base.options = $.extend({},$.carousel.defaultOptions, options);
            base.$el.data("total", base.options.data.length);
            base.$el.data("current", 0);
            base.$imageHolder = base.$el.find('.carousel-img');
            base.$carouselWrapper = base.$el.find('.carousel-wrapper');

            // Apply same styling
            base.$carouselWrapper.css('background-color',base.options.style.wrapper.color);

            // Init cache
            base.$el.data('cache','false');
            base.cache = [];

            // Add counter
            base.updateCounter();

            // Init image display
            base._dicide_size();
            base.changeImage(0);
            base.bindEvents();
            base.startAutoplay();
            base.lazyLoadHandler('initialize');
        };
        base.updateCounter = function(current){
            if(base.options.showCounter){
                base.$el.find('.carousel-counter').html(base.$el.data('current')+1 +' / '+base.$el.data('total'));
            }
        }
        base.back = function(withClear){
            base._find_previous();
            if(withClear){
                base.clearAutoplay();
                 if(base.$el.find('.carousel-controls').find('a').data('state') != "pause"){
                     base.startAutoplay();
                }
            }
            $.when(base.handleEffect('right','hide')).then(function(){
                base.changeImage(base.$el.data("current"));
                base.handleEffect('left','show');
                base.lazyLoadHandler('sequence');
            });
        }
        base.forth = function(withClear){
            base._find_next();
            if(withClear){
                base.clearAutoplay();
                if(base.$el.find('.carousel-controls').find('a').data('state') != "pause"){
                     base.startAutoplay();
                }
               
            }
            $.when(base.handleEffect('left','hide')).then(function(){
                base.changeImage(base.$el.data("current"));
                base.handleEffect('right','show');
                base.lazyLoadHandler('sequence');
            });
        }
        base.goTo = function(index){
            base.changeImage(index);
        }
        base.changeImage = function(index){
           if(base.$el.data('cache') == 'false'){
                base.$imageHolder.html($('<img  />').attr({
                    src: base.options.data[index][base.$el.data('size')],
                }))
            }else{
                 base.$imageHolder.html(base.cache[index]);
            }
            base.updateCounter();
        }
        base._find_next = function(){
            base.$el.data("current",base._search('next',1));
        }
        base._find_previous = function(){
            base.$el.data("current",base._search('previous',1));
        }
        base._search = function(way,step){
            if(way == 'previous'){
                if(base.$el.data("current")- step < 0){
                    return base.$el.data('total') - step;
                }else{
                    return base.$el.data('current') -step;
                }
            }else if(way =='next'){
                if(base.$el.data('current') + step >= base.$el.data('total')){
                    return  0;
                }else{
                    return base.$el.data('current')+step;
                }
            }
        },
        base.bindEvents = function(){
            if(base.options.showNavigation){
                base.$el.on('click','.carousel-navigation-back',function(){
                    base.back(true);
                })
                base.$el.on('click','.carousel-navigation-forth',function(){
                    base.forth(true);
                })
            }else{
                base.$el.find('.carousel-navigation-forth').remove();
                base.$el.find('.carousel-navigation-back').remove();
            }
            $(window).resize(function() {
                 base._dicide_size();
            });
            if(base.options.keyboardNavigation){
                $(document).keydown(function(e){
                    if (e.keyCode == 37) {
                       base.back(true);
                    }else if (e.keyCode==39) {
                        base.forth(true);
                    };
                });
            }
            if(base.options.autoplay.pauseOnHover){
                base.$imageHolder.find('img').mouseout(function() {
                    console.log('Clear autoplay');
                    base.clearAutoplay();
                }).mouseover(function() {
                    base.startAutoplay();
                    console.log('Start autoplay');
                });
            }
            if(base.options.showControls){
                base.$el.find('.carousel-controls').find('a').on('click',function(){
                    if($(this).data('state') == 'play'){
                        base.clearAutoplay();
                        $(this).data('state','pause');
                        $(this).text($(this).data('play'));
                    }else{
                        base.startAutoplay();
                        $(this).data('state','play');
                        $(this).text($(this).data('pause'));
                    }
                })
            }else{
                base.$el.find('.carousel-controls').remove();
            }
        }
        base.startAutoplay = function(){
            if(base.options.enableAutoplay){
                base.internal =  setInterval(function(){
                    base.forth(false);
                },base.options.autoplay.speed);
            }
        }
        base.handleEffect = function(direction,mode){
           var localPromise = $.Deferred();
           base.$imageHolder.effect(base.options.transition.effect, { direction: direction, mode: mode }, base.options.transition.speed,function(){
                localPromise.resolve();
           });
           return localPromise.promise();
        }
        base.clearAutoplay = function(){
            clearInterval(base.internal);
        }
        base._dicide_size = function(){
            var bodyWidth = $('body').width();
            if(bodyWidth < 400){
                base.$el.data('size','image');
            }else if(bodyWidth > 1200 ){
                base.$el.data('size','big');
            }else{
                base.$el.data('size','image');
            }
        }
        base.lazyLoadHandler = function(way){
            if(base.options.enablepreload){
                switch(way){
                    case 'sequence':
                        if(base.$el.data('cache-forward') < base.$el.data('cache-backwards')){
                            $.when(base.lazyLoadDoer(base.$el.data('cache-forward'),base.$el.data('cache-forward')+base.options.enablepreload),base.lazyLoadDoer(base.$el.data('cache-backwards')-base.options.enablepreload,base.$el.data('cache-backwards'))).done(function(){
                                base.$el.data('cache-backwards',base.$el.data('cache-backwards')-base.options.enablepreload);
                                base.$el.data('cache-forward',base.$el.data('cache-forward')+base.options.enablepreload);
                            })
                        }
                    break;
                    case 'initialize':
                        $.when(base.lazyLoadDoer(0,base.options.enablepreload),base.lazyLoadDoer(base.$el.data('total')-base.options.enablepreload,base.$el.data('total'))).done(function(){
                            base.$el.data('cache-backwards',base.$el.data('total')-base.options.enablepreload);
                            base.$el.data('cache-forward',base.options.enablepreload);
                            base.$el.data('cache','true');
                        });
                    break;
                }
            }
        }
        base.lazyLoadDoer = function(start,end){
            console.log(start);
            console.log(end);
            var deff  = $.Deferred();
            $.when($.each(base.options.data.slice(start,end),function(index,photo){
                var cacheImage = document.createElement('img');
                cacheImage.src = photo[base.$el.data('size')];
                base.cache[start+index] = cacheImage;
            })).done(function(){
                deff.resolve();
            });
            return deff.promise();
        }
        base.init();
    };
    $.carousel.defaultOptions = {
       data               : null,
       showNavigation     : true,
       showCaptions       : true,
       showControls       : true,
       showCounter        : true,
       enableAutoplay     : true,
       enablepreload      : 3,
       keyboardNavigation : true,
       onImageClick       : false, // (false|link|overlay)
       style: {
            wrapper : {
                'color':'#fff',
            },
            container:{
                'color':'#000',
            }
       },
       autoplay : {
            'speed'        :3000,
            'pauseOnHover' :true,
       },
       transition : {
            'speed':800,
            'effect':'slide'
       }
    };
    $.fn.carousel = function(options){
        return this.each(function(){
            (new $.carousel(this, options));
        });
    };
})(jQuery);