'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * pajinatify - A light-weight pagination plugin for jQuery
 *
 * Copyright 2018, Mehdi Dehghani
 * (http://www.github.com/dehghani-mehdi)
 *
 * @author   Mehdi Dehghani
 * @license  MIT
 *
 */
;

(function ($, window, document, undefined) {
    var pluginName = 'pajinatify',
        p = {},

    // -- Globals (shared across all plugin instances)
    defaults = {
        debug: false,
        onChange: null,
        dir: 'ltr'
    };

    var _this = void 0;

    p[pluginName] = function () {
        function _class(el, config) {
            _classCallCheck(this, _class);

            this.el = el;
            this.$el = $(el);

            this.config = $.extend({}, defaults, config);

            this._defaults = defaults;

            this.init();
            this.wireEvents();

            _this = this;
        }

        _createClass(_class, [{
            key: 'init',
            value: function init() {
                this.$el.addClass('pajinatify').addClass('pajinatify__' + this.config.dir);

                var totalCount = this.$el.data('total-count'),
                    take = this.$el.data('take');

                this.CURRENT_PAGE = this.CURRENT_PAGE || 1;

                this.TOTAL_PAGES = Math.floor(totalCount / take);
                if (totalCount % take != 0) this.TOTAL_PAGES++;

                if (this.config.debug) {
                    console.log('init-------------------------------------');
                    console.log('total count: ' + totalCount);
                    console.log('take: ' + take);
                    console.log('current page: ' + this.CURRENT_PAGE);
                    console.log('total pages: ' + this.TOTAL_PAGES);
                    console.log('-----------------------------------------');
                }

                if (this.TOTAL_PAGES > 1) this.$el.html(this.compute());else this.$el.empty();
            }
        }, {
            key: 'wireEvents',
            value: function wireEvents() {
                var _this2 = this;

                $('body').on('click', '.pajinatify__button', function (e) {
                    e.preventDefault();

                    var page = +$(e.currentTarget).attr('data-page');

                    _this2.CURRENT_PAGE = page;

                    _this2.$el.data('current', _this2.CURRENT_PAGE).html(_this2.compute());

                    if (typeof _this2.config.onChange === 'function') _this2.config.onChange.call(_this2.$el, _this2.CURRENT_PAGE);

                    _this2.$el.trigger('onChange', _this2.CURRENT_PAGE);
                });
            }
        }, {
            key: 'compute',
            value: function compute() {
                var delta = 1,
                    range = [],
                    html = [],
                    l = void 0,
                    page = void 0;

                if (this.CURRENT_PAGE == this.TOTAL_PAGES) delta = 2;
                if (this.CURRENT_PAGE == this.TOTAL_PAGES - 1) delta = 2;

                if (this.CURRENT_PAGE == 1) delta = 2;
                if (this.CURRENT_PAGE == 2) delta = 2;

                range.push(1);
                for (var i = this.CURRENT_PAGE - delta, len = this.CURRENT_PAGE + delta; i <= len; i++) {
                    if (i < this.TOTAL_PAGES && i > 1) {
                        range.push(i);
                    }
                }
                if (this.TOTAL_PAGES != 1) range.push(this.TOTAL_PAGES);

                if (this.CURRENT_PAGE != 1) {
                    page = +this.CURRENT_PAGE - 1;

                    html.push($('<span />', {
                        class: 'pajinatify__button pajinatify__arrow arrow__prev',
                        attr: {
                            'data-page': page
                        }
                    }));
                }

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = range[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _i = _step.value;

                        if (l) {
                            if (_i - l === 2) {
                                page = l + 1;

                                html.push($('<span />', {
                                    text: page,
                                    class: 'pajinatify__button',
                                    attr: {
                                        'data-page': page
                                    }
                                }));
                            } else if (_i - l !== 1) {
                                html.push($('<span />', {
                                    text: '...'
                                }));
                            }
                        }

                        page = _i;

                        html.push($('<span />', {
                            text: page,
                            class: 'pajinatify__button' + (page == this.CURRENT_PAGE ? ' pajinatify__current' : ''),
                            attr: {
                                'data-page': page
                            }
                        }));

                        l = _i;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                if (this.CURRENT_PAGE != this.TOTAL_PAGES) {
                    page = +this.CURRENT_PAGE + 1;

                    html.push($('<span />', {
                        class: 'pajinatify__button pajinatify__arrow arrow__next',
                        attr: {
                            'data-page': page
                        }
                    }));
                }

                return html;
            }
        }]);

        return _class;
    }();

    var destroy = function destroy($el) {
        if (!$el.is('div')) return;

        $el.removeClass('pajinatify').empty();

        $.removeData($el[0], 'plugin_' + pluginName);
    };

    var set = function set($el, currentPage, totalCount) {
        _this.CURRENT_PAGE = currentPage || _this.CURRENT_PAGE;

        var take = -1;
        if (totalCount) {
            take = $el.data('take');

            _this.TOTAL_PAGES = Math.floor(totalCount / take);
            if (totalCount % take != 0) _this.TOTAL_PAGES++;
        }

        _this.$el.html(_this.compute());

        if (_this.config.debug) {
            console.log('init-------------------------------------');
            console.log('total count: ' + totalCount);
            console.log('take: ' + take);
            console.log('current page: ' + _this.CURRENT_PAGE);
            console.log('total pages: ' + _this.TOTAL_PAGES);
            console.log('-----------------------------------------');
        }
    };

    $.fn[pluginName] = function (options) {
        if (typeof options === 'string') {
            switch (options) {
                case 'destroy':
                    destroy(this);
                    break;

                case 'set':
                    set(this, arguments[1], arguments[2]);
                    break;
            }

            return this;
        }

        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new p[pluginName](this, options));
            }
        });
    };
})(jQuery, window, document);

//# sourceMappingURL=jquery.pajinatify.js.map