/*! Magnific Popup - v0.9.7 - 2013-10-10
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2013 Dmitry Semenov; */
;(function($) {

/*>>core*/
/**
 * Magnific Popup Core JS file
 */


/**
 * Private static constants
 */
var CLOSE_EVENT = 'Close',
	BEFORE_CLOSE_EVENT = 'BeforeClose',
	AFTER_CLOSE_EVENT = 'AfterClose',
	BEFORE_APPEND_EVENT = 'BeforeAppend',
	MARKUP_PARSE_EVENT = 'MarkupParse',
	OPEN_EVENT = 'Open',
	CHANGE_EVENT = 'Change',
	NS = 'overlay',
	EVENT_NS = '.' + NS,
	READY_CLASS = 'overlay-ready',
	REMOVING_CLASS = 'overlay-removing',
	PREVENT_CLOSE_CLASS = 'overlay-prevent-close',
	// CDS STUFF
	CDS_OVERLAY_TEMPLATE = ' <div class="overlay_wrapper"><div data-logic="caption"><p class="overlay_description" data-replace="caption"></p></div><div style="clear:both"></div><div data-logic="meta.location.latidute"><div style="width:100%;height:150px" id="map">Loading...</div></div><div style="clear:both"></div><a href="javascript:void(0)" class="open-metadata-table" data-toggle="#table">Photo details</a><div style="clear:both"></div><div class="meta-table" style="display:none" id="table"><table class="table" data-repeat="meta"><tr><td><span data-replace="title"></span></td><td class="textalignright"><span data-replace="value"></span></td></tr></table></div><div style="clear:both"></div><div class="overlay_meta_wrapper"><ul class="overlay_photo_meta"><li data-logic="authors"><span class="key">Photographer</span><span class="value" data-replace="authors"></span></li><li data-logic="keywords"><span class="key">Keywords</span><span class="value keywords" data-replace="keywords"></span></li></ul><div style="clear:both"></div><div class="copyright-notice"><a href="http://copyright.web.cern.ch/" target="_blank">Conditions of Use</a> © 2013 CERN</div></div></div>',
	CDS_OVERLAY_ERROR_TEMPLATE = '<div class"overlay_wrapper"><p class="muted" data-replace="message"></p></div>'
	// API STUFF
	API_IMAGE_REQUEST   = '/media/photo';


/**
 * Private vars 
 */
var overlay, // As we have only one instance of overlay object, we define it locally to not to use 'this'
	overlay = function(){},
	_isJQ = !!(window.jQuery),
	_prevStatus,
	_window = $(window),
	_body,
	_document,
	_prevContentType,
	_wrapClasses,
	_currPopupType;


/**
 * Private functions
 */
var _overlayOn = function(name, f) {
		overlay.ev.on(NS + name + EVENT_NS, f);
	},
	_getEl = function(className, appendTo, html, raw) {
		var el = document.createElement('div');
		el.className = 'overlay-'+className;
		if(html) {
			el.innerHTML = html;
		}
		if(!raw) {
			el = $(el);
			if(appendTo) {
				el.appendTo(appendTo);
			}
		} else if(appendTo) {
			appendTo.appendChild(el);
		}
		return el;
	},
	_overlayTrigger = function(e, data) {
		overlay.ev.triggerHandler(NS + e, data);

		if(overlay.st.callbacks) {
			// converts "overlayEventName" to "eventName" callback and triggers it if it's present
			e = e.charAt(0).toLowerCase() + e.slice(1);
			if(overlay.st.callbacks[e]) {
				overlay.st.callbacks[e].apply(overlay, $.isArray(data) ? data : [data]);
			}
		}
	},
	_setFocus = function() {
		(overlay.st.focus ? overlay.content.find(overlay.st.focus).eq(0) : overlay.wrap).focus();
	},
	_getCloseBtn = function(type) {
		if(type !== _currPopupType || !overlay.currTemplate.closeBtn) {
			overlay.currTemplate.closeBtn = $( overlay.st.closeMarkup.replace('%title%', overlay.st.tClose ) );
			_currPopupType = type;
		}
		return overlay.currTemplate.closeBtn;
	},
	// Initialize Magnific Popup only when called at least once
	_checkInstance = function() {
		if(!$.overlay.instance) {
			overlay = new overlay();
			overlay.init();
			$.overlay.instance = overlay;
		}
	},
	// Check to close popup or not
	// "target" is an element that was clicked
	_checkIfClose = function(target) {

		if($(target).hasClass(PREVENT_CLOSE_CLASS)) {
			return;
		}

		var closeOnContent = overlay.st.closeOnContentClick;
		var closeOnBg = overlay.st.closeOnBgClick;

		if(closeOnContent && closeOnBg) {
			return true;
		} else {

			// We close the popup if click is on close button or on preloader. Or if there is no content.
			if(!overlay.content || $(target).hasClass('overlay-close') || (overlay.preloader && target === overlay.preloader[0]) ) {
				return true;
			}

			// if click is outside the content
			if(  (target !== overlay.content[0] && !$.contains(overlay.content[0], target))  ) {
				if(closeOnBg) {
					// last check, if the clicked element is in DOM, (in case it's removed onclick)
					if( $.contains(document, target) ) {
						return true;
					}
				}
			} else if(closeOnContent) {
				return true;
			}

		}
		return false;
	},
	// CSS transition detection, http://stackoverflow.com/questions/7264899/detect-css-transitions-using-javascript-and-without-modernizr
	supportsTransitions = function() {
		var s = document.createElement('p').style, // 's' for style. better to create an element if body yet to exist
			v = ['ms','O','Moz','Webkit']; // 'v' for vendor

		if( s['transition'] !== undefined ) {
			return true; 
		}
			
		while( v.length ) {
			if( v.pop() + 'Transition' in s ) {
				return true;
			}
		}
				
		return false;
	};



/**
 * Public functions
 */
overlay.prototype = {

	constructor: overlay,

	/**
	 * Initializes Magnific Popup plugin. 
	 * This function is triggered only once when $.fn.overlay or $.overlay is executed
	 */
	init: function() {
		var appVersion = navigator.appVersion;
		overlay.isIE7 = appVersion.indexOf("MSIE 7.") !== -1; 
		overlay.isIE8 = appVersion.indexOf("MSIE 8.") !== -1;
		overlay.isLowIE = overlay.isIE7 || overlay.isIE8;
		overlay.isAndroid = (/android/gi).test(appVersion);
		overlay.isIOS = (/iphone|ipad|ipod/gi).test(appVersion);
		overlay.supportsTransition = supportsTransitions();

		// We disable fixed positioned lightbox on devices that don't handle it nicely.
		// If you know a better way of detecting this - let me know.
		overlay.probablyMobile = (overlay.isAndroid || overlay.isIOS || /(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent) );
		_body = $(document.body);
		_document = $(document);

		overlay.popupsCache = {};
	},

	/**
	 * Opens popup
	 * @param  data [description]
	 */
	open: function(data) {

		var i;

		if(data.isObj === false) { 
			// convert jQuery collection to array to avoid conflicts later
			overlay.items = data.items.toArray();

			overlay.index = 0;
			var items = data.items,
				item;
			for(i = 0; i < items.length; i++) {
				item = items[i];
				if(item.parsed) {
					item = item.el[0];
				}
				if(item === data.el[0]) {
					overlay.index = i;
					break;
				}
			}
		} else {
			overlay.items = $.isArray(data.items) ? data.items : [data.items];
			overlay.index = data.index || 0;
		}

		// if popup is already opened - we just update the content
		if(overlay.isOpen) {
			overlay.updateItemHTML();
			return;
		}
		
		overlay.types = []; 
		_wrapClasses = '';
		if(data.mainEl && data.mainEl.length) {
			overlay.ev = data.mainEl.eq(0);
		} else {
			overlay.ev = _document;
		}

		if(data.key) {
			if(!overlay.popupsCache[data.key]) {
				overlay.popupsCache[data.key] = {};
			}
			overlay.currTemplate = overlay.popupsCache[data.key];
		} else {
			overlay.currTemplate = {};
		}



		overlay.st = $.extend(true, {}, $.overlay.defaults, data ); 
		overlay.fixedContentPos = overlay.st.fixedContentPos === 'auto' ? !overlay.probablyMobile : overlay.st.fixedContentPos;

		if(overlay.st.modal) {
			overlay.st.closeOnContentClick = false;
			overlay.st.closeOnBgClick = false;
			overlay.st.showCloseBtn = false;
			overlay.st.enableEscapeKey = false;
		}
		

		// Building markup
		// main containers are created only once
		if(!overlay.bgOverlay) {

			// Dark overlay
			overlay.bgOverlay = _getEl('bg').on('click'+EVENT_NS, function() {
				overlay.close();
			});

			overlay.wrap = _getEl('wrap').attr('tabindex', -1).on('click'+EVENT_NS, function(e) {
				if(_checkIfClose(e.target)) {
					overlay.close();
				}
			});

			overlay.container = _getEl('container', overlay.wrap);
		}

		overlay.contentContainer = _getEl('content');
		if(overlay.st.preloader) {
			overlay.preloader = _getEl('preloader', overlay.container, overlay.st.tLoading);
		}


		// Initializing modules
		var modules = $.overlay.modules;
		for(i = 0; i < modules.length; i++) {
			var n = modules[i];
			n = n.charAt(0).toUpperCase() + n.slice(1);
			overlay['init'+n].call(overlay);
		}
		_overlayTrigger('BeforeOpen');


		if(overlay.st.showCloseBtn) {
			// Close button
			if(!overlay.st.closeBtnInside) {
				overlay.wrap.append( _getCloseBtn() );
			} else {
				_overlayOn(MARKUP_PARSE_EVENT, function(e, template, values, item) {
					values.close_replaceWith = _getCloseBtn(item.type);
				});
				_wrapClasses += ' overlay-close-btn-in';
			}
		}

		if(overlay.st.alignTop) {
			_wrapClasses += ' overlay-align-top';
		}

	

		if(overlay.fixedContentPos) {
			overlay.wrap.css({
				overflow: overlay.st.overflowY,
				overflowX: 'hidden',
				overflowY: overlay.st.overflowY
			});
		} else {
			overlay.wrap.css({ 
				top: _window.scrollTop(),
				position: 'absolute'
			});
		}
		if( overlay.st.fixedBgPos === false || (overlay.st.fixedBgPos === 'auto' && !overlay.fixedContentPos) ) {
			overlay.bgOverlay.css({
				height: _document.height(),
				position: 'absolute'
			});
		}

		

		if(overlay.st.enableEscapeKey) {
			// Close on ESC key
			_document.on('keyup' + EVENT_NS, function(e) {
				if(e.keyCode === 27) {
					overlay.close();
				}
			});
		}

		_window.on('resize' + EVENT_NS, function() {
			overlay.updateSize();
		});


		if(!overlay.st.closeOnContentClick) {
			_wrapClasses += ' overlay-auto-cursor';
		}
		
		if(_wrapClasses)
			overlay.wrap.addClass(_wrapClasses);


		// this triggers recalculation of layout, so we get it once to not to trigger twice
		var windowHeight = overlay.wH = _window.height();

		
		var windowStyles = {};

		if( overlay.fixedContentPos ) {
            if(overlay._hasScrollBar(windowHeight)){
                var s = overlay._getScrollbarSize();
                if(s) {
                    windowStyles.paddingRight = s;
                }
            }
        }

		if(overlay.fixedContentPos) {
			if(!overlay.isIE7) {
				windowStyles.overflow = 'hidden';
			} else {
				// ie7 double-scroll bug
				$('body, html').css('overflow', 'hidden');
			}
		}

		
		
		var classesToadd = overlay.st.mainClass;
		if(overlay.isIE7) {
			classesToadd += ' overlay-ie7';
		}
		if(classesToadd) {
			overlay._addClassTooverlay( classesToadd );
		}

		// add content
		overlay.updateItemHTML();

		_overlayTrigger('BuildControls');


		// remove scrollbar, add padding e.t.c
		$('html').css(windowStyles);
		
		// add everything to DOM
		overlay.bgOverlay.add(overlay.wrap).prependTo( document.body );



		// Save last focused element
		overlay._lastFocusedEl = document.activeElement;
		
		// Wait for next cycle to allow CSS transition
		setTimeout(function() {
			
			if(overlay.content) {
				overlay._addClassTooverlay(READY_CLASS);
				_setFocus();
			} else {
				// if content is not defined (not loaded e.t.c) we add class only for BG
				overlay.bgOverlay.addClass(READY_CLASS);
			}
			
			// Trap the focus in popup
			_document.on('focusin' + EVENT_NS, function (e) {
				if( e.target !== overlay.wrap[0] && !$.contains(overlay.wrap[0], e.target) ) {
					_setFocus();
					return false;
				}
			});

		}, 16);

		overlay.isOpen = true;
		overlay.updateSize(windowHeight);
		_overlayTrigger(OPEN_EVENT);

		return data;
	},

	/**
	 * Closes the popup
	 */
	close: function() {
		if(!overlay.isOpen) return;
		_overlayTrigger(BEFORE_CLOSE_EVENT);

		overlay.isOpen = false;
		// for CSS3 animation
		if(overlay.st.removalDelay && !overlay.isLowIE && overlay.supportsTransition )  {
			overlay._addClassTooverlay(REMOVING_CLASS);
			setTimeout(function() {
				overlay._close();
			}, overlay.st.removalDelay);
		} else {
			overlay._close();
		}
	},

	/**
	 * Helper for close() function
	 */
	_close: function() {
		_overlayTrigger(CLOSE_EVENT);

		var classesToRemove = REMOVING_CLASS + ' ' + READY_CLASS + ' ';

		overlay.bgOverlay.detach();
		overlay.wrap.detach();
		overlay.container.empty();

		if(overlay.st.mainClass) {
			classesToRemove += overlay.st.mainClass + ' ';
		}

		overlay._removeClassFromoverlay(classesToRemove);

		if(overlay.fixedContentPos) {
			var windowStyles = {paddingRight: ''};
			if(overlay.isIE7) {
				$('body, html').css('overflow', '');
			} else {
				windowStyles.overflow = '';
			}
			$('html').css(windowStyles);
		}
		
		_document.off('keyup' + EVENT_NS + ' focusin' + EVENT_NS);
		overlay.ev.off(EVENT_NS);

		// clean up DOM elements that aren't removed
		overlay.wrap.attr('class', 'overlay-wrap').removeAttr('style');
		overlay.bgOverlay.attr('class', 'overlay-bg');
		overlay.container.attr('class', 'overlay-container');

		// remove close button from target element
		if(overlay.st.showCloseBtn &&
		(!overlay.st.closeBtnInside || overlay.currTemplate[overlay.currItem.type] === true)) {
			if(overlay.currTemplate.closeBtn)
				overlay.currTemplate.closeBtn.detach();
		}


		if(overlay._lastFocusedEl) {
			$(overlay._lastFocusedEl).focus(); // put tab focus back
		}
		overlay.currItem = null;	
		overlay.content = null;
		overlay.currTemplate = null;
		overlay.prevHeight = 0;

		_overlayTrigger(AFTER_CLOSE_EVENT);
	},
	
	updateSize: function(winHeight) {

		if(overlay.isIOS) {
			// fixes iOS nav bars https://github.com/dimsemenov/Magnific-Popup/issues/2
			var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
			var height = window.innerHeight * zoomLevel;
			overlay.wrap.css('height', height);
			overlay.wH = height;
		} else {
			overlay.wH = winHeight || _window.height();
		}
		// Fixes #84: popup incorrectly positioned with position:relative on body
		if(!overlay.fixedContentPos) {
			overlay.wrap.css('height', overlay.wH);
		}

		_overlayTrigger('Resize');

	},

	/**
	 * Set content of popup based on current index
	 */
	updateItemHTML: function() {
		var item = overlay.items[overlay.index];

		// Detach and perform modifications
		overlay.contentContainer.detach();

		if(overlay.content)
			overlay.content.detach();

		if(!item.parsed) {
			item = overlay.parseEl( overlay.index );
		}

		var type = item.type;	

		_overlayTrigger('BeforeChange', [overlay.currItem ? overlay.currItem.type : '', type]);
		// BeforeChange event works like so:
		// _overlayOn('BeforeChange', function(e, prevType, newType) { });
		
		overlay.currItem = item;

		

		

		if(!overlay.currTemplate[type]) {
			var markup = overlay.st[type] ? overlay.st[type].markup : false;

			// allows to modify markup
			_overlayTrigger('FirstMarkupParse', markup);

			if(markup) {
				overlay.currTemplate[type] = $(markup);
			} else {
				// if there is no markup found we just define that template is parsed
				overlay.currTemplate[type] = true;
			}
		}

		if(_prevContentType && _prevContentType !== item.type) {
			overlay.container.removeClass('overlay-'+_prevContentType+'-holder');
		}
		
		var newContent = overlay['get' + type.charAt(0).toUpperCase() + type.slice(1)](item, overlay.currTemplate[type]);
		overlay.appendContent(newContent, type);

		item.preloaded = true;

		_overlayTrigger(CHANGE_EVENT, item);
		_prevContentType = item.type;
		
		// Append container back after its content changed
		overlay.container.prepend(overlay.contentContainer);

		_overlayTrigger('AfterChange');
	},


	/**
	 * Set HTML content of popup
	 */
	appendContent: function(newContent, type) {
		overlay.content = newContent;
		
		if(newContent) {
			if(overlay.st.showCloseBtn && overlay.st.closeBtnInside &&
				overlay.currTemplate[type] === true) {
				// if there is no markup, we just append close button element inside
				if(!overlay.content.find('.overlay-close').length) {
					overlay.content.append(_getCloseBtn());
				}
			} else {
				overlay.content = newContent;
			}
		} else {
			overlay.content = '';
		}

		_overlayTrigger(BEFORE_APPEND_EVENT);
		overlay.container.addClass('overlay-'+type+'-holder');

		overlay.contentContainer.append(overlay.content);
	},



	
	/**
	 * Creates Magnific Popup data object based on given data
	 * @param  {int} index Index of item to parse
	 */
	parseEl: function(index) {
		var item = overlay.items[index],
			type = item.type;

		if(item.tagName) {
			item = { el: $(item) };
		} else {
			item = { data: item, src: item.src };
		}

		if(item.el) {
			var types = overlay.types;

			// check for 'overlay-TYPE' class
			for(var i = 0; i < types.length; i++) {
				if( item.el.hasClass('overlay-'+types[i]) ) {
					type = types[i];
					break;
				}
			}

			item.src = item.el.attr('data-overlay-src');
			if(!item.src) {
				item.src = item.el.attr('href');
			}
		}

		item.type = type || overlay.st.type || 'inline';
		item.index = index;
		item.parsed = true;
		overlay.items[index] = item;
		_overlayTrigger('ElementParse', item);

		return overlay.items[index];
	},


	/**
	 * Initializes single popup or a group of popups
	 */
	addGroup: function(el, options) {
		var eHandler = function(e) {
			e.overlayEl = this;
			overlay._openClick(e, el, options);
		};

		if(!options) {
			options = {};
		} 

		var eName = 'click.overlay';
		options.mainEl = el;
		
		if(options.items) {
			options.isObj = true;
			el.off(eName).on(eName, eHandler);
		} else {
			options.isObj = false;
			if(options.delegate) {
				el.off(eName).on(eName, options.delegate , eHandler);
			} else {
				options.items = el;
				el.off(eName).on(eName, eHandler);
			}
		}
	},
	_openClick: function(e, el, options) {
		var midClick = options.midClick !== undefined ? options.midClick : $.overlay.defaults.midClick;


		if(!midClick && ( e.which === 2 || e.ctrlKey || e.metaKey ) ) {
			return;
		}

		var disableOn = options.disableOn !== undefined ? options.disableOn : $.overlay.defaults.disableOn;

		if(disableOn) {
			if($.isFunction(disableOn)) {
				if( !disableOn.call(overlay) ) {
					return true;
				}
			} else { // else it's number
				if( _window.width() < disableOn ) {
					return true;
				}
			}
		}
		
		if(e.type) {
			e.preventDefault();

			// This will prevent popup from closing if element is inside and popup is already opened
			if(overlay.isOpen) {
				e.stopPropagation();
			}
		}
			

		options.el = $(e.overlayEl);
		if(options.delegate) {
			options.items = el.find(options.delegate);
		}
		overlay.open(options);
	},


	/**
	 * Updates text on preloader
	 */
	updateStatus: function(status, text) {

		if(overlay.preloader) {
			if(_prevStatus !== status) {
				overlay.container.removeClass('overlay-s-'+_prevStatus);
			}

			if(!text && status === 'loading') {
				text = overlay.st.tLoading;
			}

			var data = {
				status: status,
				text: text
			};
			// allows to modify status
			_overlayTrigger('UpdateStatus', data);

			status = data.status;
			text = data.text;

			overlay.preloader.html(text);

			overlay.preloader.find('a').on('click', function(e) {
				e.stopImmediatePropagation();
			});

			overlay.container.addClass('overlay-s-'+status);
			_prevStatus = status;
		}
	},


	/*
		"Private" helpers that aren't private at all
	 */
	_addClassTooverlay: function(cName) {
		overlay.bgOverlay.addClass(cName);
		overlay.wrap.addClass(cName);
	},
	_removeClassFromoverlay: function(cName) {
		this.bgOverlay.removeClass(cName);
		overlay.wrap.removeClass(cName);
	},
	_hasScrollBar: function(winHeight) {
		return (  (overlay.isIE7 ? _document.height() : document.body.scrollHeight) > (winHeight || _window.height()) );
	},
	_parseMarkup: function(template, values, item) {

		var arr;
		if(item.data) {
			values = $.extend(item.data, values);
		}
		_overlayTrigger(MARKUP_PARSE_EVENT, [template, values, item] );

		$.each(values, function(key, value) {
			if(value === undefined || value === false) {
				return true;
			}
			arr = key.split('_');
			if(arr.length > 1) {
				var el = template.find(EVENT_NS + '-'+arr[0]);

				if(el.length > 0) {
					var attr = arr[1];
					if(attr === 'replaceWith') {
						if(el[0] !== value[0]) {
							el.replaceWith(value);
						}
					} else if(attr === 'img') {
						if(el.is('img')) {
							el.attr('src', value);
						} else {
							el.replaceWith( '<img src="'+value+'" class="' + el.attr('class') + '" />' );
						}
					} else {
						el.attr(arr[1], value);
					}
				}

			} else {
				template.find(EVENT_NS + '-'+key).html(value);
			}
		});
	},

	_getScrollbarSize: function() {
		// thx David
		if(overlay.scrollbarSize === undefined) {
			var scrollDiv = document.createElement("div");
			scrollDiv.id = "overlay-sbm";
			scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
			document.body.appendChild(scrollDiv);
			overlay.scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
		}
		return overlay.scrollbarSize;
	}

}; /* overlay core prototype end */




/**
 * Public static functions
 */
$.overlay = {
	instance: null,
	proto: overlay.prototype,
	modules: [],

	open: function(options, index) {
		_checkInstance();	

		if(!options) {
			options = {};
		} else {
			options = $.extend(true, {}, options);
		}
		options.isObj = true;
		options.index = index || 0;
		return this.instance.open(options);
	},

	close: function() {
		return $.overlay.instance && $.overlay.instance.close();
	},

	registerModule: function(name, module) {
		if(module.options) {
			$.overlay.defaults[name] = module.options;
		}
		$.extend(this.proto, module.proto);			
		this.modules.push(name);
	},

	defaults: {   

		// Info about options is in docs:
		// http://dimsemenov.com/plugins/magnific-popup/documentation.html#options
		
		disableOn: 0,	

		key: null,

		midClick: false,

		mainClass: '',

		preloader: true,

		focus: '', // CSS selector of input to focus after popup is opened
		
		closeOnContentClick: false,

		closeOnBgClick: true,

		closeBtnInside: true, 

		showCloseBtn: true,

		enableEscapeKey: true,

		modal: false,

		alignTop: false,
	
		removalDelay: 0,
		
		fixedContentPos: 'auto', 
	
		fixedBgPos: 'auto',

		overflowY: 'auto',

		closeMarkup: '<button title="%title%" type="button" class="overlay-close">&times;</button>',

		tClose: 'Close (Esc)',

		tLoading: 'Loading...'

	}
};



$.fn.overlay = function(options) {
	_checkInstance();

	var jqEl = $(this);

	// We call some API method of first param is a string
	if (typeof options === "string" ) {

		if(options === 'open') {
			var items,
				itemOpts = _isJQ ? jqEl.data('overlay') : jqEl[0].overlay,
				index = parseInt(arguments[1], 10) || 0;

			if(itemOpts.items) {
				items = itemOpts.items[index];
			} else {
				items = jqEl;
				if(itemOpts.delegate) {
					items = items.find(itemOpts.delegate);
				}
				items = items.eq( index );
			}
			overlay._openClick({overlayEl:items}, jqEl, itemOpts);
		} else {
			if(overlay.isOpen)
				overlay[options].apply(overlay, Array.prototype.slice.call(arguments, 1));
		}

	} else {
		// clone options obj
		options = $.extend(true, {}, options);

		/*
		 * As Zepto doesn't support .data() method for objects
		 * and it works only in normal browsers
		 * we assign "options" object directly to the DOM element. FTW!
		 */
		if(_isJQ) {
			jqEl.data('overlay', options);
		} else {
			jqEl[0].overlay = options;
		}

		overlay.addGroup(jqEl, options);

	}
	return jqEl;
};

/*>>core*/

/*>>inline*/

var INLINE_NS = 'inline',
	_hiddenClass,
	_inlinePlaceholder, 
	_lastInlineElement,
	_putInlineElementsBack = function() {
		if(_lastInlineElement) {
			_inlinePlaceholder.after( _lastInlineElement.addClass(_hiddenClass) ).detach();
			_lastInlineElement = null;
		}
	};

$.overlay.registerModule(INLINE_NS, {
	options: {
		hiddenClass: 'hide', // will be appended with `overlay-` prefix
		markup: '',
		tNotFound: 'Content not found'
	},
	proto: {

		initInline: function() {
			overlay.types.push(INLINE_NS);

			_overlayOn(CLOSE_EVENT+'.'+INLINE_NS, function() {
				_putInlineElementsBack();
			});
		},

		getInline: function(item, template) {

			_putInlineElementsBack();

			if(item.src) {
				var inlineSt = overlay.st.inline,
					el = $(item.src);

				if(el.length) {

					// If target element has parent - we replace it with placeholder and put it back after popup is closed
					var parent = el[0].parentNode;
					if(parent && parent.tagName) {
						if(!_inlinePlaceholder) {
							_hiddenClass = inlineSt.hiddenClass;
							_inlinePlaceholder = _getEl(_hiddenClass);
							_hiddenClass = 'overlay-'+_hiddenClass;
						}
						// replace target inline element with placeholder
						_lastInlineElement = el.after(_inlinePlaceholder).detach().removeClass(_hiddenClass);
					}

					overlay.updateStatus('ready');
				} else {
					overlay.updateStatus('error', inlineSt.tNotFound);
					el = $('<div>');
				}

				item.inlineElement = el;
				return el;
			}

			overlay.updateStatus('ready');
			overlay._parseMarkup(template, {}, item);
			return template;
		}
	}
});

/*>>inline*/



/* > cds-image */
var _imgInterval;
$.overlay.registerModule('cds',{
	options:{
		markup: '<div class="cds-overlay-wrapper">'+
                            '<div class="cds-overlay-close">'+
                                '<div class="overlay-close"></div>'+
                            '</div>'+
                            '<div class="cds-overlay-content">'+
                                '<div class="cds-overlay-left">'+
                                    '<div class="cds-overlay-fake-table">'+
                                        '<div class="cds-overlay-fake-table-cell">'+
                                            '<div class="overlay-img"></div>' +
                                        '</div>'+
                                    '</div>'+
                                '</div>'+
                                '<div class="cds-overlay-right">'+
                                    '<div class="cds-image-count"><div class="overlay-counter"></div></div>'+
                                    '<div class="cds-overlay-right-content overlay-right-sidebar"><div class="overlay-title"></div></div>'+
                                '<div>'+
                            '</div>'+
                          '</div>',
        cursor: 'overlay-zoom-out-cur',
		titleSrc: 'Loading ...',
		verticalFit: true,
		tError: '<a href="%url%">The image</a> could not be loaded.',
		includeMap:true
	}, // End of options
	proto:{
		/* Required functions */
		initCds : function(){
			var cdsST = overlay.st.cds,
			ns = '.image-cds';
			overlay.types.push('cds');

		},
		resizeImage: function() {
			var item = overlay.currItem;
			if(!item || !item.img) return;

			if(overlay.st.cds.verticalFit) {
				var decr = 0;
				if(overlay.isLowIE) {
					decr = parseInt(item.img.css('padding-top'), 10) + parseInt(item.img.css('padding-bottom'),10);
				}
				item.img.css('max-height', overlay.wH-decr);
			}
		},
		_onImageHasSize: function(item) {
			if(item.img) {

				item.hasSize = true;

				if(_imgInterval) {
					clearInterval(_cdsInterval);
				}

				item.isCheckingImgSize = false;

				_overlayTrigger('ImageHasSize', item);

				if(item.imgHidden) {
					if(overlay.content)
						overlay.content.removeClass('overlay-loading');
					item.imgHidden = false;
				}

			}
		},
		findImageSize: function(item) {

			var counter = 0,
				img = item.img[0],
				overlaySetInterval = function(delay) {

					if(_imgInterval) {
						clearInterval(_cdsInterval);
					}
					// decelerating interval that checks for size of an image
					_cdsInterval = setInterval(function() {
						if(img.naturalWidth > 0) {
							overlay._onImageHasSize(item);
							return;
						}

						if(counter > 200) {
							clearInterval(_cdsInterval);
						}

						counter++;
						if(counter === 3) {
							overlaySetInterval(10);
						} else if(counter === 40) {
							overlaySetInterval(50);
						} else if(counter === 100) {
							overlaySetInterval(500);
						}
					}, delay);
				};

			overlaySetInterval(1);
		},
		getCds : function(item,template){
			if(overlay.st.delegate =='img'){
				$photo_id = item.el[0].dataset.photo_id;
			}else{
				$photo_id = item.el[0].firstChild.dataset.photo_id;
			}
			$.when(overlay._requestData($photo_id)).then(
				function(data){ // on success
					data = $.parseJSON(data);
					overlay._renderData(data);
					if(overlay.st.cds.includeMap){
						overlay._buildMap(data);
					}else{
	            		overlay._removeMap();
	            	}
	            },function(data){ // on error
	            	overlay._renderError();

	            }
			)
            var guard = 0,
				onLoadComplete = function() {
					if(item) {
						if (item.img[0].complete) {
							item.img.off('.overlayloader');

							if(item === overlay.currItem){
								overlay._onImageHasSize(item);

								overlay.updateStatus('ready');
							}

							item.hasSize = true;
							item.loaded = true;

							_overlayTrigger('ImageLoadComplete');

						}
						else {
							guard++;
							if(guard < 200) {
								setTimeout(onLoadComplete,100);
							} else {
								onLoadError();
							}
						}
					}
				},
				onLoadError = function() {
					if(item) {
						item.img.off('.overlayloader');
						if(item === overlay.currItem){
							overlay._onImageHasSize(item);
							overlay.updateStatus('error', cdsST.tError.replace('%url%', item.src) );
						}
						item.hasSize = true;
						item.loaded = true;
						item.loadError = true;
					}
				},
				cdsST = overlay.st.cds;
			var el = template.find('.overlay-img');
			if(el.length) {
				var img = document.createElement('img');
				img.className = 'overlay-img';
				item.img = $(img).on('load.overlayloader', onLoadComplete).on('error.overlayloader', onLoadError);
				img.src = item.src;
				if(el.is('img')) {
					item.img = item.img.clone();
				}
				if(item.img[0].naturalWidth > 0) {
					item.hasSize = true;
				}
			}
			overlay._parseMarkup(template, {
				title:'Loading...',
				img_replaceWith: item.img
			}, item);

			overlay.resizeImage();
			if(item.hasSize) {
				if(_imgInterval) clearInterval(_imgInterval);
				if(item.loadError) {
					template.addClass('overlay-loading');
					overlay.updateStatus('error', cdsST.tError.replace('%url%', item.src) );
				} else {
					template.removeClass('overlay-loading');
					overlay.updateStatus('ready');
				}
				return template;
			}
			overlay.updateStatus('loading');
			item.loading = true;
			if(!item.hasSize) {
				item.imgHidden = true;
				template.addClass('overlay-loading');
				overlay.findImageSize(item);
			}
			return template;
		},
		/* Helper functions */
		_requestData : function(photo_id){
			var deff = $.Deferred();
			$.get(API_IMAGE_REQUEST,{photo_id:photo_id,metadata:'yep'},function(data){
				deff.resolve(data);
        	}).fail(function(error){
        		deff.reject('fail');
			})
			return deff.promise();
		},
		_renderData  : function(data){
			$('.cds-overlay-right-content').empty();
			$('.cds-overlay-right-content').html($(CDS_OVERLAY_TEMPLATE).template(data));
		},
		_renderError : function(data){
			$('.cds-overlay-right-content').empty();
			$('.cds-overlay-right-content').html($(CDS_OVERLAY_ERROR_TEMPLATE).template({message:'Sorry, infos are not available right now.'}));
		},
		_buildMap 		:function(data){
			// Second check
			if(data.meta.location.latidute != '' && data.meta.location.longtitude != ''){
				var baseIcon = L.icon({
                   iconUrl: "http://leafletjs.com/dist/images/marker-icon.png",
                   iconSize: [25, 41],
                   shadowSize: [42, 30],
                   iconAnchor: [12.5, 41],
                   popupAnchor: [0, -12]
                                   });
                    var map = L.map('map',{ zoomControl:true }).setView([data.meta["location"]["latidute"],data.meta["location"]["longtitude"]], 15);
                    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                }).addTo(map);
                    L.marker([data.meta["location"]["latidute"], data.meta["location"]["longtitude"]],{icon:baseIcon}).addTo(map)
			}else{
				overlay._removeMap();
			}
		},
		_removeMap:function(){
			$('#map').remove();
		}
	} // End of proto

});

/* # cds-image */


/*>>gallery*/
/**
 * Get looped index depending on number of slides
 */
var _getLoopedId = function(index) {
		var numSlides = overlay.items.length;
		if(index > numSlides - 1) {
			return index - numSlides;
		} else  if(index < 0) {
			return numSlides + index;
		}
		return index;
	},
	_replaceCurrTotal = function(text, curr, total) {
		return text.replace(/%curr%/gi, curr + 1).replace(/%total%/gi, total);
	};

$.overlay.registerModule('gallery', {

	options: {
		enabled: false,
		arrowMarkup: '<button title="%title%" type="button" class="overlay-arrow overlay-arrow-%dir%"></button>',
		preload: [0,2],
		navigateByImgClick: true,
		arrows: true,

		tPrev: 'Previous (Left arrow key)',
		tNext: 'Next (Right arrow key)',
		tCounter: '%curr% of %total%'
	},

	proto: {
		initGallery: function() {

			var gSt = overlay.st.gallery,
				ns = '.overlay-gallery',
				supportsFastClick = Boolean($.fn.overlayFastClick);

			overlay.direction = true; // true - next, false - prev
			if(!gSt || !gSt.enabled ) return false;

			_wrapClasses += ' overlay-gallery';

			_overlayOn(OPEN_EVENT+ns, function() {

				if(gSt.navigateByImgClick) {
					overlay.wrap.on('click'+ns, '.overlay-img', function() {
						if(overlay.items.length > 1) {
							overlay.next();
							return false;
						}
					});
				}

				_document.on('keydown'+ns, function(e) {
					if (e.keyCode === 37) {
						overlay.prev();
					} else if (e.keyCode === 39) {
						overlay.next();
					}
				});
			});

			_overlayOn('UpdateStatus'+ns, function(e, data) {
				if(data.text) {
					data.text = _replaceCurrTotal(data.text, overlay.currItem.index, overlay.items.length);
				}
			});

			_overlayOn(MARKUP_PARSE_EVENT+ns, function(e, element, values, item) {
				var l = overlay.items.length;
				values.counter = l > 1 ? _replaceCurrTotal(gSt.tCounter, item.index, l) : '';
			});

			_overlayOn('BuildControls' + ns, function() {
				if(overlay.items.length > 1 && gSt.arrows && !overlay.arrowLeft) {
					var markup = gSt.arrowMarkup,
						arrowLeft = overlay.arrowLeft = $( markup.replace(/%title%/gi, gSt.tPrev).replace(/%dir%/gi, 'left') ).addClass(PREVENT_CLOSE_CLASS),			
						arrowRight = overlay.arrowRight = $( markup.replace(/%title%/gi, gSt.tNext).replace(/%dir%/gi, 'right') ).addClass(PREVENT_CLOSE_CLASS);

					var eName = supportsFastClick ? 'overlayFastClick' : 'click';
					arrowLeft[eName](function() {
						overlay.prev();
					});			
					arrowRight[eName](function() {
						overlay.next();
					});	

					// Polyfill for :before and :after (adds elements with classes overlay-a and overlay-b)
					if(overlay.isIE7) {
						_getEl('b', arrowLeft[0], false, true);
						_getEl('a', arrowLeft[0], false, true);
						_getEl('b', arrowRight[0], false, true);
						_getEl('a', arrowRight[0], false, true);
					}

					overlay.container.append(arrowLeft.add(arrowRight));
				}
			});

			_overlayOn(CHANGE_EVENT+ns, function() {
				if(overlay._preloadTimeout) clearTimeout(overlay._preloadTimeout);

				overlay._preloadTimeout = setTimeout(function() {
					overlay.preloadNearbyImages();
					overlay._preloadTimeout = null;
				}, 16);		
			});


			_overlayOn(CLOSE_EVENT+ns, function() {
				_document.off(ns);
				overlay.wrap.off('click'+ns);
			
				if(overlay.arrowLeft && supportsFastClick) {
					overlay.arrowLeft.add(overlay.arrowRight).destroyoverlayFastClick();
				}
				overlay.arrowRight = overlay.arrowLeft = null;
			});

		}, 
		next: function() {
			overlay.direction = true;
			overlay.index = _getLoopedId(overlay.index + 1);
			overlay.updateItemHTML();
		},
		prev: function() {
			overlay.direction = false;
			overlay.index = _getLoopedId(overlay.index - 1);
			overlay.updateItemHTML();
		},
		goTo: function(newIndex) {
			overlay.direction = (newIndex >= overlay.index);
			overlay.index = newIndex;
			overlay.updateItemHTML();
		},
		preloadNearbyImages: function() {
			var p = overlay.st.gallery.preload,
				preloadBefore = Math.min(p[0], overlay.items.length),
				preloadAfter = Math.min(p[1], overlay.items.length),
				i;

			for(i = 1; i <= (overlay.direction ? preloadAfter : preloadBefore); i++) {
				overlay._preloadItem(overlay.index+i);
			}
			for(i = 1; i <= (overlay.direction ? preloadBefore : preloadAfter); i++) {
				overlay._preloadItem(overlay.index-i);
			}
		},
		_preloadItem: function(index) {
			index = _getLoopedId(index);

			if(overlay.items[index].preloaded) {
				return;
			}

			var item = overlay.items[index];
			if(!item.parsed) {
				item = overlay.parseEl( index );
			}

			_overlayTrigger('LazyLoad', item);

			if(item.type === 'image') {
				item.img = $('<img class="overlay-img" />').on('load.overlayloader', function() {
					item.hasSize = true;
				}).on('error.overlayloader', function() {
					item.hasSize = true;
					item.loadError = true;
					_overlayTrigger('LazyLoadError', item);
				}).attr('src', item.src);
			}


			item.preloaded = true;
		}
	}
});
/*>>gallery*/

})(window.jQuery);