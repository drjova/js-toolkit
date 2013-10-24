(function($){

    $.paginationAjax = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("paginationAjax", base);

        base.init = function(){
            base.options = $.extend({},$.paginationAjax.defaultOptions, options);
            base.$button = $('body').find(base.options.buttonLoader);
            base.$button.bind('click',base.loadMore);
            base.$el.bind('onFinish',base.options.onFinish);
            base.error = false;
            $.when(base.proccessEngine()).then(function(data){
                base.loadedData = data;
                base.finish = (base.loadedData.limit <= base.options.limit) ? true : false;
                if(base.finish){ base.$button.remove();}
            },function(data){
                base.error = true;
            });

        }
        base.getEngine = function(){
            var defer = $.Deferred();
            $.getJSON(base.options.apiURL,base.options.apiData,function(data){
                defer.resolve(data)
            }).fail(function(){
                defer.reject('error');
            })
            return defer.promise();
        }
        base.proccessEngine = function(){
            var defer = $.Deferred();
            $.when(base.getEngine()).then(function(data){
                defer.resolve(data);
            },function(data){ // Fail get
               defer.reject('error');
            })
            return defer.promise();
        }
        base.fakeEngine = function(){
            var defer = $.Deferred();
            if(base.finish){
               defer.reject('complete');
            }else if(base.error){
                defer.reject('error');
            }else{
                $.when(base.renderData(base.loadedData.photos.slice(base.options.offset, base.options.start))).then(function(domObject){
                     base.finish = ((base.$el.find('a').length + domObject.length) >= base.loadedData.limit) ? true : false;
                     if(base.finish){base._cleanButtonActions('complete');}
                     if(domObject.length > 0){
                        defer.resolve(domObject);
                        base.options.offset = base.options.start;
                        base.options.start += base.options.limit;
                     }else{
                        defer.reject('complete');
                     }
                },function(domObject){
                     defer.reject('error');
                });
            }
            return defer.promise();
        }
        base.loadMore = function(){
            base._cleanButtonActions('loading');
            $.when(base.fakeEngine()).then(
                function(domObject){ // on success (resolve defer)
                    $.when(base.appendData(domObject)).then(function(){
                        base.$el.trigger('onFinish');
                        if(!base.finish){
                            base._refreshButtonAction();
                        }
                    })
                },function(reason){ // on error (rejected defer)
                    base._cleanButtonActions(reason);
                }
            );
        }
        base._cleanButtonActions = function(reason){
             base.$button.text(base.options.button[reason]);
             base.$button.unbind("click");
             base.$button.addClass('disabled');
        }
        base._refreshButtonAction = function(){
            base.$button.bind('click',base.loadMore);
            base.$button.text(base.options.button.idle);
            base.$button.removeClass('disabled');
        }
        base.renderData = function(data){
            var defer = $.Deferred(),
                $html  = [];
            $.when($.each(data,function(index,item){
                var elements = $(base.options.IMAGE_TEMPLATE);
                elements.attr('href',item.sizes.icon_1024);
                elements.data('photo_id',item.recID)
                elements.find('img').attr('src',item.sizes.icon).attr('data-photo_id',item.recID);
                $html.push(elements);
            })).done(function(){
                defer.resolve($html);
            })
            return defer.promise();
        }
        base.appendData = function(html){
            var defer = $.Deferred();
            for (var i=0;i<html.length;i++){
                base.$el.append(html[i]);
                if(i == html.length-1){
                    var count = 0;
                    base.$el.find('img').load(function(){
                       if(count == html.length-1){
                         defer.resolve();
                        }
                       count++;
                    })
                }
            }
           return defer.promise();
        }
        base.init();
    };
    $.paginationAjax.defaultOptions = {
        'apiURL'      : '/media/album',
        'apiData'     : {
            'album_id': null,
            'metadata': true,
            'format'  : 'html'
        },
        'preloadNext' : true,
        'buttonLoader': '.loadMore',
        'limit'       : 20,
        'offset'      : 0,
        'start'       : 0,
        'button'      : {
            'loading' : 'Loading...',
            'idle'    : 'Load More...',
            'complete': 'All images has been uploaded!',
            'error'   : 'Sorry, something wrong happend please refresh the page.'
        },
        'IMAGE_TEMPLATE': '<a><img alt="Album" /></a>',
        'onFinish'    : function(){}
    };

    $.fn.paginationAjax = function(options){
        return this.each(function(){
            (new $.paginationAjax(this, options));
        });
    };

})(jQuery);