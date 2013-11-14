(function($){
    $.carousel = function(el,options){
        var base = this;
        base.$el = $(el);
        base.el  = el;
        base.$el.addClass('carousel-watcher');
        // make it accesible from data
        base.$el.data('carousel',base);
        base.init = function(){
            base.options = $.extend({},$.carousel.defaultOptions,options);
            base.ready   = false;
            // Ladies and Gentleman this is a hack
            recid = base.getID(base.options.start);
            base.current = (recid) ? recid : 0;
            base.iFrame = (window.self === window.top) ? false : true;
            base.total   = base.options.data.photos.length;
            base.warning = false;
            base.view.init();
            base.navigation.init();
            base.widgets.init();
            base.handler.init();
            base.autoplay.init();
            //base.autoHide.init();
        };
        // Setup the view
        base.view = {
            init : function(){
                base.view.view();
            },
            loading : function(){
                base.ready = false;
                base.autoplay.pause();
            },
            preview : function(){
                base.ready = true;
                base.autoplay.init();
            },
            view : function(){
               var template = "<div class='carousel-wrapper'><div class='carousel-img-wrapper'><div class='carousel-img-container'></div></div></div>"
               base.$el.append(template)
               base.$imgWrapper = base.$el.find('.carousel-img-wrapper');
               base.$imgContainer = base.$el.find('.carousel-img-container');
            }
        }
        base.navigation = {
            // Bind the controls
            init: function(){
                // check if keyboard is enabled
                if(base.options.showNavigation){
                    // build the navigation view
                    base.navigation.view();
                }
                if(base.options.keyboardNavigation){
                    base.navigation.keyboard();
                }
            },
            next: function(){
                base.change('next');
            },
            prev: function(){
                base.change('prev');
            },
            keyboard: function(){
                $('body').keydown('keypress',function(event){
                    if(event.keyCode == '37'){
                        base.navigation.prev();
                    }else if(event.keyCode == '39'){
                        base.navigation.next();
                    }
                })
            },
            view : function(){
                var wrapper = $('<div>',{'class':'carousel-navigation'}),
                    next    = $('<a>'),
                    prev    = $('<a>');
                next.addClass('carousel-navigation-next').attr('href','javascript:void(0)');
                prev.addClass('carousel-navigation-prev').attr('href','javascript:void(0)');
                // Bind events
                next.bind('click',base.navigation.next);
                prev.bind('click',base.navigation.prev);
                // Append them to the wrapper
                next.appendTo(wrapper);
                prev.appendTo(wrapper);
                // Finaly add wrapper to $el
                base.$el.append(wrapper);
            }
        }
        base.widgets = {
            init: function(){
                if(base.options.enableWidgets){
                    base.widgets.view();
                }
            },
            refresh: function(){
                // Refresh the
                if(base.options.enableWidgets && base.options.widgets.active.length > 0){
                    var wrapper = $('<div>',{'class':'carousel-widgets'});
                    var ul = base.$el.find('.carousel-widgets-list');
                    ul.empty();
                    for (var i=0;i<base.options.widgets.active.length;i++){
                        var li = $('<li/>')
                            .appendTo(ul);
                        var a  = $('<a/>')
                            .addClass('link-for-'+base.options.widgets.active[i])
                            .text(base.options.widgets.active[i])
                            .attr('href',base.widgets.parseLink(base.current,base.options.widgets.active[i]))
                            .appendTo(li)
                            .bind('click',base.widgets.overlay);
                    }
                }
            },
            view: function(){
                var wrapper = $('<div>',{'class':'carousel-widgets'});
                // Finaly add wrapper to $el
                base.$el.append(wrapper);
                if (base.options.widgets.active.length > 0){
                    var ul = $('<ul/>',{'class':'carousel-widgets-list'})
                    for (var i=0;i<base.options.widgets.active.length;i++){
                        var li = $('<li/>')
                            .appendTo(ul);
                        var a  = $('<a/>')
                            .addClass('link-for-'+base.options.widgets.active[i])
                            .text(base.options.widgets.active[i])
                            .attr('href',base.widgets.parseLink(base.current,base.options.widgets.active[i]))
                            .appendTo(li)
                            .bind('click',base.widgets.overlay);
                    }
                    wrapper.html(ul);
                }
                // Add copy right notice
                if(base.options.copyright){
                    var copyWrap = $('<span />',{'class':'carousel-copy'});
                    copyWrap.html(base.options.copyright);
                    wrapper.append(copyWrap);
                }
                var copy = base.options.copyright
                wrapper.html()
            },
            parseLink : function(index,type){
                // ok find the recid
                var recid = base.options.data.photos[index].recID;
                return base.options.widgets.url
                       .replace('{{recid}}',recid)
                       .replace('{{type}}',type)
            },
            overlay : function(e){
                e.preventDefault();
                // Better to ask for
                // forgiveness than permission
                try{
                    if(base.iFrame){
                        parent.$.overlay.open({
                            items:{
                                src:$(this).attr('href')
                            },
                            type: 'ajax'
                        });
                    }else{
                        $.overlay.open({
                            items:{
                                src:$(this).attr('href')
                            },
                            type: 'ajax'
                        });
                    }
                }catch(error){
                    base.warn.show('widgets','error');
                }
            }
        }
        base.warn = {
            show : function(which,type){
                if(!base.warning){
                    base.$warning = base.warn.view(which,type);
                    base.warning = true;
                    base.warn.timer();
                }
            },
            hide : function(){
                // In any case you want to hard
                // stop the warning
                // maybe when you change image
                if(base.warning){
                    clearTimeout(base.warningTimer);
                    base.$warning.fadeOut(function(){
                        base.$warning.remove();
                    });
                }
                base.warning = false;
            },
            timer: function(){
                base.warningTimer = setTimeout(function(){
                    base.warn.hide()
                },3000)
            },
            view : function(which,type){
                if (!base.warning){
                    var warning = $('<span/>');
                    warning.addClass('warning-message');
                    var url = base.options.records.url.replace('{{recid}}',base.getIndex(base.current));
                    var a   = "<a href='"+url+"' target='_blank'>here</a>";
                    var message = '<p>'+base.options[which].messages[type].replace('{{url}}',a)+'</p>';
                    warning.html(message);
                    base.$el.append(warning);
                    return warning;
                }else{
                    return false;
                }
            }
        }
        base.change = function(way){
            // Change slide
            way = (way !== 'undifined') ? way : 'next';
            base.warn.hide();
            $.when(base.handler.change(way)).then(
                function(){ //everything went fine :)
                    base.view.preview();
                    base.widgets.refresh()
                },
                function(){ // A prev action is still in progress
                    base.view.loading();
                }
            )
        }
        base.autoplay = {
            init : function(){
                if(base.options.enableAutoplay){
                    base.autoplay.play();
                }
            },
            play : function(){
                base.interval = setInterval(base.navigation.next,base.options.autoplay.speed)
            },
            pause: function(){
                base.interval = clearInterval(base.interval);
            }
        }
        base.handler = {
            init : function(){
                base.$imgContainer.html(base.handler.load(base.current,'active'));
                var preload = base.handler.preload()
                base.$imgContainer.prepend(preload['prev']);
                base.$imgContainer.append(preload['next'])
                base.ready = true;
            },
            load : function(index, clas){
                var $img = $('<img>',{
                    'class' : '',
                    'src'   : base.options.data.photos[index].sizes.large
                })
                var imgWrap = $('<div/>',{
                    'class': clas
                });
                imgWrap.addClass('carousel-just-img-wrapper')
                imgWrap.html('<span class="loading">Loading</span>');
                $img.load(function(){
                    imgWrap.html($img);
                })
                return imgWrap;
            },
            preload : function(){
                return {
                    'next':base.handler.load(base.getTarget('next'),'hidden'),
                    'prev': base.handler.load(base.getTarget('prev'),'hidden')
                }
            },
            change : function(way){
                var def = $.Deferred();
                if (base.ready){
                    base.view.loading();
                    // Lets find the index of each image
                    var prev = base.$imgContainer.find('.active').prev().index(),
                        curr = base.$imgContainer.find('.active').index(),
                        next = base.$imgContainer.find('.active').next().index();
                    if(way == 'next'){
                        base.$imgContainer
                            .find('.carousel-just-img-wrapper')
                            .eq(curr)
                            .effect(base.options.transition.effect, {
                                    'direction':'left',
                                    'mode':'hide'
                                },
                                base.options.transition.speed,
                                function(){
                                    $(this).removeClass('active')
                                           .addClass('hidden');
                                    base.$imgContainer
                                        .find('.carousel-just-img-wrapper')
                                        .eq(prev)
                                        .remove();
                                }
                            );
                        base.$imgContainer
                            .find('.carousel-just-img-wrapper')
                            .eq(next)
                            .effect(base.options.transition.effect, {
                                'direction':'right',
                                'mode':'show'
                            },
                            base.options.transition.speed,
                                function(){
                                    $(this).removeClass('hidden')
                                           .addClass('active');
                                    base.current = base.getTarget('next');
                                    var preload = base.handler.preload()
                                    base.$imgContainer.append(preload['next'])
                                    def.resolve();
                                }
                            );
                    }else{
                        base.$imgContainer
                            .find('.carousel-just-img-wrapper')
                            .eq(curr)
                            .effect(base.options.transition.effect, {
                                'direction':'right',
                                'mode':'hide'
                            },
                            base.options.transition.speed,
                                function(){
                                    $(this).removeClass('active')
                                    .addClass('hidden');
                                    base.$imgContainer
                                        .find('.carousel-just-img-wrapper')
                                        .eq(next)
                                    .remove();
                                }
                            );
                        base.$imgContainer
                            .find('.carousel-just-img-wrapper')
                            .eq(prev)
                            .effect(base.options.transition.effect, {
                                'direction':'left',
                                'mode':'show'
                            },base.options.transition.speed,
                                function(){
                                    $(this).removeClass('hidden')
                                           .addClass('active')
                                base.current = base.getTarget('prev');
                                var preload = base.handler.preload()
                                base.$imgContainer.prepend(preload['prev'])
                                def.resolve();
                            }
                        );
                    }
                }else{
                    def.reject();
                }
                return def.promise();
            }
        }
        base.getTarget = function(direction){
            // Find the target position
            if(direction === 'next'){
                return (base.current === base.total-1) ? 0 : base.current + 1;
            }else{
                return (base.current === 0) ? base.total-1 : base.current - 1;
            }
        }
        base.getID = function(index){
            for(var i = 0; i<=base.options.data.photos.length;i++){
                if(index == base.options.data.photos[i].recID){
                    return i;
                }
            }
            return false;
        }
        base.getIndex = function(index){
            var record = base.options.data.photos[index];
            return record.recID;
        }
        /*base.autoHide = {
            init : function(){
                base.$el.bind('mouseover',base.autoHide.show);
                base.$el.bind('mouseout',base.autoHide.hide);
            },
            show: function(){
                base.autoplay.pause();
            },
            hide: function(){
                base.autoplay.init();
            }
        } */
        base.init();
    }; // End of the plugin

    $.carousel.defaultOptions = {
        data               : null,
        showNavigation     : true,
        showControls       : true,
        enableAutoplay     : true,
        enableWidgets      : true,
        keyboardNavigation : true,
        start              : 0,
        copyright          : '<a target="_blank" href="http://cern.ch">&copy; Cern</a>',
        style: {
            wrapper : {
                'color':'#fff',
            },
            container:{
                'color':'#000',
            }
        },
        autoplay : {
            'speed':3000,
        },
        transition : {
            'speed':800,
            'effect':'slide'
        },
        widgets: {
            'active':['embed','metadata','download','link'],
            'url'   : 'http://pccis55.cern.ch/media/widgets?recid={{recid}}&widget={{type}}',
            'messages':{
                'error': 'Sorry, something wrong happend. See the photo details {{url}}'
            }
        },
        records :{
            'url' : 'http://pccis55.cern.ch/record/{{recid}}',
        }
    };
    $.fn.carousel = function(options){
        return this.each(function(){
            (new $.carousel(this,options));
        });
    };
})(jQuery);
