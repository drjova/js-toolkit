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
        base.options.padding    = parseFloat(  base.$el.css('padding-left') )
        base.init = function(){
            var row     = 0,
                elements = [],
                rownum  = 1;

            base.options.images.each(function(index){
                var $this = $(this),
                    $img  = ($this.is("img")) ? $this : $(this).find("img");

                var w = (typeof $img.data("width") != 'undefined') ? $img.data("width") : $img.width(),
                        h = (typeof $img.data("height") != 'undefined') ? $img.data("height") : $img.height();

                var imgParams = base.getImgProperty($img);

                $img.data("width", w);
                $img.data("height", h);

                var nw = Math.ceil(w/h*base.options.targetHeight),
                        nh = Math.ceil(base.options.targetHeight);

                elements.push([this, nw, nh, imgParams['w'], imgParams['h']]);

                row += nw + imgParams['w'] + base.options.padding;

                if( row > base.options.albumWidth && elements.length != 0 ){

                        // call the method that calculates the final image sizes
                        // remove one set of padding as it's not needed for the last image in the row
                        base.resizeRow(elements, (row - base.options.padding), settings, rownum);

                        // reset our row
                        delete row;
                        delete elements;
                        row         = 0;
                        elements    = [];
                        rownum      += 1;
                }
                if ( base.options.images.length-1 == index && elements.length != 0){
                        base.resizeRow(elements, row, base.options, rownum);

                        // reset our row
                        delete row;
                        delete elements;
                        row         = 0;
                        elements    = [];
                        rownum      += 1;
                }
            });
        }
        base.resizeRow = function( obj, row, settings, rownum){
            var imageExtras         = (base.options.padding * (obj.length - 1)) + (obj.length * obj[0][3]),
                albumWidthAdjusted  = base.options.albumWidth - imageExtras,
                overPercent         = albumWidthAdjusted / (row - imageExtras),
                // start tracking our width with know values that will make up the total width
                // like borders and padding
                trackWidth          = imageExtras,
                // guess whether this is the last row in a set by checking if the width is less
                // than the parent width.
                lastRow             = (row < base.options.albumWidth  ? true : false);
            for (var i = 0; i < obj.length; i++) {



                var $obj        = $(obj[i][0]),
                    fw          = Math.floor(obj[i][1] * overPercent),
                    fh          = Math.floor(obj[i][2] * overPercent),
                // if the element is the last in the row,
                // don't apply right hand padding (this is our flag for later)
                    isNotLast   = !!(( i < obj.length - 1 ));

                /*
                 * Checking if the user wants to not stretch the images of the last row to fit the
                 * parent element size
                 */
                if(base.options.allowPartialLastRow === true && lastRow === true){
                   fw = obj[i][1];
                   fh = obj[i][2];
                }


                /*
                 *
                 * Because we use % to calculate the widths, it's possible that they are
                 * a few pixels out in which case we need to track this and adjust the
                 * last image accordingly
                 *
                 */
                trackWidth += fw;


                /*
                 *
                 * here we check if the combined images are exactly the width
                 * of the parent. If not then we add a few pixels on to make
                 * up the difference.
                 *
                 * This will alter the aspect ratio of the image slightly, but
                 * by a noticable amount.
                 *
                 * If the user doesn't want full width last row, we check for that here
                 *
                 */
                if(!isNotLast && trackWidth < base.options.albumWidth){
                    if(base.options.allowPartialLastRow === true && lastRow === true){
                        fw = fw;
                    }else{
                        fw = fw + (base.options.albumWidth - trackWidth);
                    }
                }

                /*
                 *
                 * We'll be doing a few things to the image so here we cache the image selector
                 *
                 *
                 */
                var $img = ( $obj.is("img") ) ? $obj : $obj.find("img");

                /*
                 *
                 * Set the width of the image and parent element
                 * if the resized element is not an image, we apply it to the child image also
                 *
                 * We need to check if it's an image as the css borders are only measured on
                 * images. If the parent is a div, we need make the contained image smaller
                 * to accommodate the css image borders.
                 *
                 */
                $img.width(fw);
                if( !$obj.is("img") ){
                    $obj.width(fw + obj[i][3]);
                }


                /*
                 *
                 * Set the height of the image
                 * if the resized element is not an image, we apply it to the child image also
                 *
                 */
                $img.height(fh);
                if( !$obj.is("img") ){
                    $obj.height(fh + obj[i][4]);
                }


                /*
                 *
                 * Apply the css extras like padding
                 *
                 */
                base.applyModifications($obj, isNotLast, settings);


                /*
                 *
                 * Assign the effect to show the image
                 * Default effect is using jquery and not CSS3 to support more browsers
                 * Wait until the image is loaded to do this
                 *
                 */

                $img
                    .load(function(target) {
                    return function(){
                        if( base.options.effect == 'default'){
                            target.animate({opacity: '1'},{duration: base.options.fadeSpeed});
                        } else {
                            if(base.options.direction == 'vertical'){
                                var sequence = (rownum <= 10  ? rownum : 10);
                            } else {
                                var sequence = (i <= 9  ? i+1 : 10);
                            }

                            target.addClass(base.options.effect);
                            target.addClass("effect-duration-" + sequence);
                        }
                    }
                    }($obj))
                    /*
                     * fix for cached or loaded images
                     * For example if images are loaded in a "window.load" call we need to trigger
                     * the load call again
                     */
                    .each(function() {
                            if(this.complete) $(this).trigger('load');
                    });

            }
        }
        base.applyModifications = function($obj, isNotLast, settings){
            var css = {
                    // Applying padding to element for the grid gap effect
                    'margin-bottom'     : base.options.padding + "px",
                    'margin-right'      : (isNotLast) ? base.options.padding + "px" : "0px",
                    // Set it to an inline-block by default so that it doesn't break the row
                    'display'           : base.options.display,
                    // Set vertical alignment otherwise you get 4px extra padding
                    'vertical-align'    : "bottom",
                    // Hide the overflow to hide the caption
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
        base.init();
    };
    $.justify.defaultOptions = {
        // the ideal height you want your images to be
        'targetHeight'          : 400,
        // width of the area the collage will be in
        'albumWidth'            : '',
        // padding between the images. Using padding left as we assume padding is even all the way round
        'padding'               : '',
        // object that contains the images to collage
        'images'                : '',
        // how quickly you want images to fade in once ready can be in ms, "slow" or "fast"
        'fadeSpeed'             : "fast",
        // how the resized block should be displayed. inline-block by default so that it doesn't break the row
        'display'               : "inline-block",
        // which effect you want to use for revealing the images (note CSS3 browsers only),
        'effect'                : 'default',
        // effect delays can either be applied per row to give the impression of descending appearance
        // or horizontally, so more like a flock of birds changing direction
        'direction'             : 'vertical',
        // Sometimes there is just one image on the last row and it gets blown up to a huge size to fit the
        // parent div width. To stop this behaviour, set this to true
        'allowPartialLastRow'   : false
    };

    $.fn.justify = function(options){
        return this.each(function(){
            (new $.justify(this, options));
        });
    };
})(jQuery);