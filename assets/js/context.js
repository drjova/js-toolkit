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
            $(document).bind('click',base._destroyPopup);
        };
        base.contextEngine  = function(event){
            event.preventDefault();
            base._destroyPopup();
            base.templateEngine();
        }
        base.divEngine = function(){

        }
        base.templateEngine = function(){
            var element = $('<div class="context-menu"><ul></ul></div>');
            for(var i=0;i < base.options.source.length;i++){
                $('ul',element).append('<li>'+base.options.source[i].title+'</li>');
            }
            base.$el.append(element);
        }
        base._destroyPopup = function(event){
            console.log(event);
            base.$el.find('.context-menu').remove();
        }
        base.init();
    };
    $.overideContext.defaultOptions = {
        'style'  : 'tabs', // (tabs|list|div)
        'type'   : 'overlay', // (overlay|fixed)
        'source' : null // (json|html|iframe)
    };
    $.fn.overideContext = function(options){
        return this.each(function(){
            (new $.overideContext(this, options));
        });
    };
})(jQuery);