(function($){

    $.justify = function(el, options){

        var base = this;
        base.options = $.extend({},$.justify.defaultOptions, options);
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        base.$el.data("justify", base);

        base.options.albumWidth = base.$el.width();
        base.options.images     = base.$el.children();
        base.options.padding    = parseFloat(base.$el.css('padding-left'));

        // Add vars for refresh time
        base.lastParsedRowSize      = null;
        base.lastParsedElement      = [];
        base.elementsParsedAlready  = 0;
        base.init = function(){
            var row     = 0,
                elements = [],
                rownum  = 1;

            base.options.images.each(function(index){

                var $this = $(this),
                    $img  = ($this.is("img")) ? $this : $(this).find("img");

                var w         = (typeof $img.data("width") != 'undefined') ? $img.data("width") : $img.width(),
                    h         = (typeof $img.data("height") != 'undefined') ? $img.data("height") : $img.height(),
                    imgParams = base.getImgProperty($img),
                    nw        = Math.ceil(w/h*base.options.height),
                    nh        = Math.ceil(base.options.height);

                // Save original with and height
                $img.data("width", w);
                $img.data("height", h);

                elements.push([this, nw, nh, imgParams['w'], imgParams['h']]);

                row += nw + imgParams['w'] + base.options.padding;

                if( row > base.options.albumWidth && elements.length != 0 ){
                        base.resizeRow(elements, (row - base.options.padding), base.options);
                        base.lastParsedRowSize = row;
                        base.lastParsedElement = elements;
                        row         = 0;
                        elements    = [];
                }
                if ( base.options.images.length-1 == index && elements.length != 0){
                        base.resizeRow(elements, row, base.options);
                        // We are on the last element so save them for the next round
                        base.lastParsedRowSize = row;
                        base.lastParsedElement = elements;
                        // Just clear some memory form dom
                        delete row;
                        delete elements;
                }
                base.elementsParsedAlready+=1;
            });
        }
        base.resizeRow = function( obj, row, settings){
            var imageExtras         = (base.options.padding * (obj.length - 1)) + (obj.length * obj[0][3]),
                albumWidthAdjusted  = base.options.albumWidth - imageExtras,
                overPercent         = albumWidthAdjusted / (row - imageExtras),
                trackWidth          = imageExtras,
                lastRow             = (row < base.options.albumWidth  ? true : false);
            for (var i = 0; i < obj.length; i++) {
                var $obj        = $(obj[i][0]),
                    fw          = Math.floor(obj[i][1] * overPercent),
                    fh          = Math.floor(obj[i][2] * overPercent),
                    isNotLast   = !!(( i < obj.length - 1 ));

                if(base.options.notFillLastRow === true && lastRow === true){
                   fw = obj[i][1];
                   fh = obj[i][2];
                }
                trackWidth += fw;

                if(!isNotLast && trackWidth < base.options.albumWidth){
                    if(base.options.notFillLastRow === true && lastRow === true){
                        fw = fw;
                    }else{
                        fw = fw + (base.options.albumWidth - trackWidth);
                    }
                }

                var $img = ( $obj.is("img") ) ? $obj : $obj.find("img");

                $img.width(fw);
                if( !$obj.is("img") ){
                    $obj.width(fw + obj[i][3]);
                }

                $img.height(fh);
                if( !$obj.is("img") ){
                    $obj.height(fh + obj[i][4]);
                }
                base.applyModifications($obj, isNotLast, settings);
                $img
                    .load(function(target) {
                    return function(){
                          target.animate({opacity: '1'},{duration: 'fast'});
                    }
                    }($obj))
                    .each(function() {
                        if(this.complete) $(this).trigger('load');
                    });

            }
        }
        base.applyModifications = function($obj, isNotLast, settings){
            var css = {
                    'margin-bottom'     : base.options.padding + "px",
                    'margin-right'      : (isNotLast) ? base.options.padding + "px" : "0px",
                    'display'           : 'inline-block',
                    'vertical-align'    : "bottom",
                    'overflow'          : "hidden"
                };
            return $obj.css(css);
        }
        base.getImgProperty = function( img ){
            $img = $(img);
            var params =  new Array();
            params["w"] = (parseFloat($img.css("border-left-width")) + parseFloat($img.css("border-right-width")));
            params["h"] = (parseFloat($img.css("border-top-width")) + parseFloat($img.css("border-bottom-width")));
            return params;
        }
        base.refresh = function(){

            base.options.images = base.$el.find(base.options.delegate).slice(base.elementsParsedAlready,base.$el.find(base.options.delegate).length);

            var row     = base.lastParsedRowSize,
                elements = base.lastParsedElement;
            base.options.images.each(function(index){

                var $this = $(this),
                    $img  = ($this.is("img")) ? $this : $(this).find("img");

                var w = (typeof $img.data("width") != 'undefined') ? $img.data("width") : $img.width(),
                    h = (typeof $img.data("height") != 'undefined') ? $img.data("height") : $img.height();

                var imgParams = base.getImgProperty($img);

                $img.data("width", w);
                $img.data("height", h);
                var nw = Math.ceil(w/h*base.options.height),
                    nh = Math.ceil(base.options.height);

                elements.push([this, nw, nh, imgParams['w'], imgParams['h']]);

                row += nw + imgParams['w'] + base.options.padding;


               if( row > base.options.albumWidth && elements.length != 0 ){
                        base.resizeRow(elements, (row - base.options.padding), base.options);

                        base.lastParsedRowSize = row;
                        base.lastParsedElement = elements;
                        // reset our row
                        row         = 0;
                        elements    = [];

                }
                if ( base.options.images.length-1 == index && elements.length != 0){
                        base.resizeRow(elements, row, base.options);

                        base.lastParsedRowSize = row;
                        base.lastParsedElement = elements;
                        // reset our row
                        delete row;
                        delete elements;
                }
                base.elementsParsedAlready+=1;
            });
        }
        base.init();
    };
    $.justify.defaultOptions = {
        'height'         : 100,
        'notFillLastRow' : true,
        'delegate'       : 'a'
    };

    $.fn.justify = function(options){
        return this.each(function(){
            (new $.justify(this, options));
        });
    };
})(jQuery);