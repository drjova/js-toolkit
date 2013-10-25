(function($){
    $.overideContext = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("overideContext", base);

        base.init = function(){
            base.options = $.extend({},$.overideContext.defaultOptions, options);
            // Bind the overideContext to the element
            base.$el.bind("contextmenu",base.contextEngine);
            base.$el.css('position','relative');
            $(document).bind('mousedown',base._destroyPopup);
            base.contextParser();
            base.initalize = false;
            base.isOpen = false;
        };
        base.contextEngine  = function(event){
            event.preventDefault();
            if(base.isOpen){
                base._positionOnMouseClick(event);
            }else{
                base._destroyPopup(event);
                base._positionOnMouseClick(event);
                base._showPopup();
            }
        }
        base.modalEngine = function(){
            var $that = $(this);
            $.overlay.open({
              items: {
                src: $that.attr('href'),
                type: 'inline'
              }
            });
        }
        base.textEngine = function(dataset){
            var element = base._createWrapper('<div>',dataset,'text');
            if (dataset.source.title !== 'undefined' && dataset.source.title != ''){
                $('<h2></h2>',{
                    'text':dataset.source.title
                }).appendTo(element);
            }
            if (dataset.source.text !== 'undefined' && dataset.source.text != ''){
                $('<p></p>',{
                    'text' : dataset.source.text
                }).appendTo(element);
            }
            return element;
        }
        base.listEngine = function(dataset){
            var element = base._createWrapper('<ul>',dataset,'list');
            if(dataset.source !== 'undefined' && dataset.source.length > 0){
                for(var i = 0; i < dataset.source.length; i++){
                    var li = $('<li>',{
                            'class':'oc-list-item-'+i
                        })
                    var a = $('<a>',{
                                'class'  : (dataset.source[i].class  !== 'undefined')  ? dataset.source[i].class  : 'oc-link-item-'+i,
                                'href'   : (dataset.source[i].href   !== 'undefined')  ? dataset.source[i].href   : '#link-item-'+i,
                                'title'  : (dataset.source[i].title  !== 'undefined')  ? dataset.source[i].title  : 'Link item '+i,
                                'text'   : (dataset.source[i].title  !== 'undefined')  ? dataset.source[i].title  : 'Link item '+i,
                                'target' : (dataset.source[i].target !== 'undefined')  ? dataset.source[i].target : '',
                            });
                    if(dataset.source[i].type !== 'undefined'){
                        if(dataset.source[i].type == 'modal'){
                            a.bind('click',base.modalEngine);
                        }
                    }
                    li.append(a);
                    element.append(li);
                }
                return element;
            }else{
                return false;
            }
        }
        base.htmlEngine = function(dataset){
            var element = base._createWrapper('<div>',dataset,'text');
            if(dataset.source !== 'undefined' && dataset.source != ''){
                var html = $(dataset.source);
                if(html != [] && html != ''){
                    element.append(html.html());
                }
                return element;
            }else{
                return false;
            }
        }
        base.contextParser = function(){
            var element = $('<div class="oc-menu"><div class="oc-content"></div></div>');
            var closeWrapper = $('<div>',{
                'class':'oc-close'
            })
            var close = $('<a href="javascript:void(0)">&times;</a>').bind('click',base._removeOnLinkClick);
            closeWrapper.append(close)
            $(element).prepend(closeWrapper);
            for(var i=0;i < base.options.data.length;i++){
                switch(base.options.data[i].type){
                    case 'text':
                        if(base.textEngine(base.options.data[i])){
                            $('.oc-content',element).append(base.textEngine(base.options.data[i]));
                        }
                    break;
                    case 'list':
                        if(base.listEngine(base.options.data[i])){
                            $('.oc-content',element).append(base.listEngine(base.options.data[i]));
                        }
                    break;
                    case 'html':
                        if(base.htmlEngine(base.options.data[i])){
                            $('.oc-content',element).append(base.htmlEngine(base.options.data[i]));
                        }
                    break;
                }
            }
            $(element).find('a').bind('click',base._removeOnLinkClick);
            base.element = element;

        }
        base.contextRefresh = function(){
            base.init();
        }
        base._createWrapper = function(tag,dataset,type){
           var element = $(tag,{
                'class' : (dataset.class !== 'undefined') ? dataset.class : 'oc-type-'+type,
            });
            return element;
        }
        base._destroyPopup = function(event){
            console.log($(event.target).parents('.oc-menu').length)
            if($(event.target).parents('.oc-menu').length == 0){
                base.$el.find('.oc-menu').hide();
                base.isOpen = false;
            }else{
                return false;
            }
        }
        base._showPopup = function(){
            if(!base.initalize){
                base.$el.append(base.element);
                base.initalize = true;
            }else{
                base.$el.find('.oc-menu').show();
            }
            base.isOpen = true;
        }
        base._positionOnMouseClick = function(event){
            if(!$(event.target).parents('.oc-menu').length){
                base.element.css('top',parseInt(event.pageY)+'px');
                base.element.css('left',parseInt(event.pageX)+'px');
            }else{
                return false;
            }
        }
        base._removeOnLinkClick = function(){
             base.$el.find('.oc-menu').hide();
             base.isOpen = false;
        }
        base.init();
    };
    $.overideContext.defaultOptions = {
        'title'       : null,
        'description' : null,
        'data'        : null
    };
    $.fn.overideContext = function(options){
        return this.each(function(){
            (new $.overideContext(this, options));
        });
    };
})(jQuery);