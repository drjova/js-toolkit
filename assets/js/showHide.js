(function($){
    
    $.ShowHide = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;
        
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        
        // Add a reverse reference to the DOM object
        base.$el.data("ShowHide", base);
        
        base.init = function(){
            base.options = $.extend({},$.ShowHide.defaultOptions, options);
            if (base.options.joiner == null)
                base.options.joiner = base.options.separator;

            var words = base.$el.html().split(base.options.separator),
                total = words.length;
            base.$el.data('total',total);
            if (base.options.limit < total){
                words = $.map(words,function(value,i){
                   return base.options.markup.replace('{{item}}',value);
                });
                base.$el.data('shown-state',base.options.wrapperMarkup.replace('{{items}}',words.slice(0,total).join(base.options.joiner)));
                base.$el.data('hidden-state',base.options.wrapperMarkup.replace('{{items}}',words.slice(0,base.options.limit).join(base.options.joiner)));
                base.$el.data('state','hidden');
                base.create();
            }else{
                return false;
            }
        };
        base.create = function(){
            base.$el.empty();
            $('<span>',{
                addClass:'showHide-wrapper'
            }).appendTo(base.$el);
            base.$el.find('.showHide-wrapper').html(base.$el.data('hidden-state'));
            $("<a />", { 
                  click: function(){
                    base.$el.trigger('changeState');
                    if(base.$el.data('state') == "hidden"){
                        $(this).text(base.options.showText.replace("{{total}}",base.$el.data('total')))
                    }else{
                        $(this).text(base.options.hideText.replace("{{limited}}",base.options.limit))
                    }
                  }, 
                  addClass: ".showHide-trigger",
                  text: base.options.showText.replace("{{total}}",base.$el.data('total')),
                  href: 'javascript:void(0)'
            }).appendTo(base.$el); 
        };
        base.changeState = function(){
            if(base.$el.data('state') == "hidden"){
                base.$el.find('.showHide-wrapper').html(base.$el.data('shown-state'));
                base.$el.data('state','shown');
            }else{
                base.$el.find('.showHide-wrapper').html(base.$el.data('hidden-state'));
                base.$el.data('state','hidden');
            }
        };
        base.$el.on('changeState',function(){
            base.changeState();
        });
        // Run initializer
        base.init();
    };
    /*
        > Show/Hide; Text patterns supported
        ------------------------------------
        {{total}} : Total number of items
        {{limited}} : The number of limited items

        > Markup; Text wrapper
        ------------------------------------
        {{item}} : the value (required!!!!!!)
        # example
        .... (etc.)
        markup : "<li>{{item}}</li>"
        .... (etc.)

        > wrapperMarkup; Text wrapper
        ------------------------------------
        {{items}} : the values(required!!!!!!)
        # example
        .... (etc.)
        wrapperMarkup : "<ul>{{items}}</ul>"
        .... (etc.)

        > Separator == Joiner (by default)
        ------------------------------------
        
        TIPS!
        ------------------------------------
        When you using lists for markup it is
        highly recommended not use joiner

        #example
        .... (etc.)
        joiner        : ""  <------ Empty joiner
        wrapperMarkup : "<ul>{{items}}</ul>"
        markup        : "<li>{{item}}</li>"
        .... (etc.)

    */
    $.ShowHide.defaultOptions = {
        separator     : ',',
        joiner        : null,
        limit         : 2,
        showText      : "Show all ({{total}})",
        hideText      : "Show less ({{limited}})",
        wrapperMarkup : "{{items}}",
        markup        : "{{item}}",
        showAsTags    : false
    };
    
    $.fn.showHide = function(options){
        return this.each(function(){
            (new $.ShowHide(this, options));
        });
    };
    
})(jQuery);