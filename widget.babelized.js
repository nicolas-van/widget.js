"use strict";

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
Copyright (c) 2012, Nicolas Vanhoren
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met: 

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer. 
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution. 

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function () {
    "use strict";

    if (typeof exports !== "undefined") {
        // node
        module.exports = function (w) {
            if (!w.document) {
                throw new Error("widget.js requires a window with a document");
            }
            return declare(w.document);
        };
    } else {
        // define global variable 'widget'
        window.widget = declare(window.document);
    }

    function declare(document) {
        function createCustomEvent(type, detail) {
            if (typeof CustomEvent === "function") {
                return new CustomEvent(type, { detail: detail });
            } else {
                var e = document.createEvent("CustomEvent");
                e.initCustomEvent(type, false, false, detail);
                return e;
            }
        }

        function matches(elm, selector) {
            if (elm.matches) return elm.matches(selector);
            if (elm.matchesSelector) return elm.matchesSelector(selector);
            var matches = (elm.document || elm.ownerDocument).querySelectorAll(selector),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== elm) {}
            return i > -1;
        }

        var widget = {};
        widget.internal = {};

        widget.LifeCycle = function () {
            function LifeCycle() {
                _classCallCheck(this, LifeCycle);

                this.__lifeCycle = true;
                this.__lifeCycleChildren = [];
                this.__lifeCycleParent = null;
                this.__lifeCycleDestroyed = false;
            }

            _createClass(LifeCycle, [{
                key: "destroy",
                value: function destroy() {
                    this.children.forEach(function (el) {
                        el.destroy();
                    });
                    this.parent = undefined;
                    this.__lifeCycleDestroyed = true;
                }
            }, {
                key: "destroyed",
                get: function get() {
                    return this.__lifeCycleDestroyed;
                }
            }, {
                key: "parent",
                set: function set(parent) {
                    var _this = this;

                    if (this.parent && this.parent.__lifeCycle) {
                        this.parent.__lifeCycleChildren = this.parent.children.filter(function (el) {
                            return el !== _this;
                        });
                    }
                    this.__lifeCycleParent = parent;
                    if (parent && parent.__lifeCycle) {
                        parent.__lifeCycleChildren.push(this);
                    }
                },
                get: function get() {
                    return this.__lifeCycleParent;
                }
            }, {
                key: "children",
                get: function get() {
                    return this.__lifeCycleChildren.slice();
                }
            }]);

            return LifeCycle;
        }();

        widget.EventDispatcher = function (_widget$LifeCycle) {
            _inherits(EventDispatcher, _widget$LifeCycle);

            function EventDispatcher() {
                _classCallCheck(this, EventDispatcher);

                var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(EventDispatcher).call(this));

                _this2._listeners = [];
                return _this2;
            }

            _createClass(EventDispatcher, [{
                key: "addEventListener",
                value: function addEventListener(type, callback) {
                    (this._listeners[type] = this._listeners[type] || []).push(callback);
                }
            }, {
                key: "removeEventListener",
                value: function removeEventListener(type, callback) {
                    var stack = this._listeners[type] || [];
                    for (var i = 0; i < stack.length; i++) {
                        if (stack[i] === callback) {
                            stack.splice(i, 1);
                        }
                    }
                }
            }, {
                key: "dispatchEvent",
                value: function dispatchEvent(event, overrideType) {
                    var stack = this._listeners[overrideType || event.type] || [];
                    for (var i = 0, l = stack.length; i < l; i++) {
                        stack[i].call(this, event);
                    }
                }
            }, {
                key: "on",
                value: function on(type, func) {
                    this.addEventListener(type, func);
                    return this;
                }
            }, {
                key: "off",
                value: function off(type, func) {
                    this.removeEventListener(type, func);
                    return this;
                }
            }, {
                key: "trigger",
                value: function trigger(arg1, arg2) {
                    if (arg1 instanceof Event) {
                        this.dispatchEvent(arg1);
                    } else {
                        var ev = createCustomEvent(arg1, arg2);
                        this.dispatchEvent(ev);
                    }
                    return this;
                }
            }, {
                key: "destroy",
                value: function destroy() {
                    this._listeners = [];
                    _get(Object.getPrototypeOf(EventDispatcher.prototype), "destroy", this).call(this);
                }
            }]);

            return EventDispatcher;
        }(widget.LifeCycle);

        widget.Widget = function (_widget$EventDispatch) {
            _inherits(Widget, _widget$EventDispatch);

            _createClass(Widget, [{
                key: "tagName",
                value: function tagName() {
                    return 'div';
                }
            }, {
                key: "className",
                value: function className() {
                    return '';
                }
            }, {
                key: "attributes",
                value: function attributes() {
                    return {};
                }
            }]);

            function Widget() {
                _classCallCheck(this, Widget);

                var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Widget).call(this));

                _this3.__widgetAppended = false;
                _this3.__widgetExplicitParent = false;
                _this3.__widgetDomEvents = {};
                _this3.__widgetElement = document.createElement(_this3.tagName());
                _this3.className().split(" ").filter(function (name) {
                    return name !== "";
                }).forEach(function (name) {
                    return _this3.el.classList.add(name);
                });
                var atts = _this3.attributes();
                for (var key in atts) {
                    _this3.el.setAttribute(key, atts[key]);
                }_this3.el.__widgetWidget = _this3;
                _this3.el.dataset.__widget = "";

                _this3.el.innerHTML = _this3.render();
                return _this3;
            }

            _createClass(Widget, [{
                key: "destroy",
                value: function destroy() {
                    this.trigger("destroying");
                    this.children.forEach(function (el) {
                        el.destroy();
                    });
                    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
                    _get(Object.getPrototypeOf(Widget.prototype), "destroy", this).call(this);
                }
            }, {
                key: "appendTo",
                value: function appendTo(target) {
                    target.insertBefore(this.el, null);
                    this.__checkAppended();
                    return this;
                }
            }, {
                key: "prependTo",
                value: function prependTo(target) {
                    target.insertBefore(this.el, target.firstChild);
                    this.__checkAppended();
                    return this;
                }
            }, {
                key: "insertAfter",
                value: function insertAfter(target) {
                    target.parentNode.insertBefore(this.el, target.nextSibling);
                    this.__checkAppended();
                    return this;
                }
            }, {
                key: "insertBefore",
                value: function insertBefore(target) {
                    target.parentNode.insertBefore(this.el, target);
                    this.__checkAppended();
                    return this;
                }
            }, {
                key: "replace",
                value: function replace(target) {
                    target.parentNode.replaceChild(this.el, target);
                    this.__checkAppended();
                    return this;
                }
            }, {
                key: "detach",
                value: function detach() {
                    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
                    this.__checkAppended();
                    return this;
                }
            }, {
                key: "render",
                value: function render() {
                    return "";
                }
            }, {
                key: "addEventListener",
                value: function addEventListener(type, callback) {
                    _get(Object.getPrototypeOf(Widget.prototype), "addEventListener", this).call(this, type, callback);
                    var res = /^dom:(\w+)(?: (.*))?$/.exec(type);
                    if (!res) return;
                    if (!this.__widgetDomEvents[type]) {
                        var domCallback;
                        if (!res[2]) {
                            domCallback = function (e) {
                                this.dispatchEvent(e, type);
                            }.bind(this);
                        } else {
                            domCallback = function (e) {
                                var elem = e.target;
                                while (elem && elem !== this.el && !matches(elem, res[2])) {
                                    elem = elem.parentNode;
                                }
                                if (elem && elem !== this.el) this.dispatchEvent(e, type);
                            }.bind(this);
                        }
                        this.el.addEventListener(res[1], domCallback);
                        this.__widgetDomEvents[type] = [1, domCallback];
                    } else {
                        this.__widgetDomEvents[type][0] += 1;
                    }
                }
            }, {
                key: "removeEventListener",
                value: function removeEventListener(type, callback) {
                    _get(Object.getPrototypeOf(Widget.prototype), "removeEventListener", this).call(this, type, callback);
                    var res = /^dom:(\w+)(?: (.*))?$/.exec(type);
                    if (!res) return;
                    if (!this.__widgetDomEvents[type]) return;
                    this.__widgetDomEvents[type][0] -= 1;
                    if (this.__widgetDomEvents[type][0] === 0) {
                        this.el.removeEventListener(res[1], this.__widgetDomEvents[type][1]);
                        delete this.__widgetDomEvents[type];
                    }
                }
            }, {
                key: "resetParent",
                value: function resetParent() {
                    this.__widgetExplicitParent = false;
                    this.__checkAppended();
                }
            }, {
                key: "__checkAppended",
                value: function __checkAppended() {
                    // check for parent change
                    if (!this.__widgetExplicitParent) {
                        var parent = this.el.parentNode;
                        while (parent && !(parent.dataset && parent.dataset.__widget !== undefined)) {
                            parent = parent.parentNode;
                        }
                        parent = parent ? widget.getWidget(parent) : null;
                        if (parent !== this.parent) {
                            this.parent = parent;
                            this.__widgetExplicitParent = false;
                        }
                    }

                    // update appendedToDom and propagate to all sub elements
                    var inHtml = document.body.contains(this.el);
                    if (this.appendedToDom === inHtml) return;
                    this.__widgetAppended = inHtml;
                    this.trigger(inHtml ? "appendedToDom" : "removedFromDom");
                    Array.prototype.forEach.call(this.el.querySelectorAll("[data-__widget]"), function (el) {
                        widget.getWidget(el).__widgetAppended = inHtml;
                        widget.getWidget(el).trigger(inHtml ? "appendedToDom" : "removedFromDom");
                    });
                }
            }, {
                key: "el",
                get: function get() {
                    return this.__widgetElement;
                }
            }, {
                key: "appendedToDom",
                get: function get() {
                    return this.__widgetAppended;
                }
            }, {
                key: "parent",
                set: function set(parent) {
                    _set(Object.getPrototypeOf(Widget.prototype), "parent", parent, this);
                    this.__widgetExplicitParent = true;
                },
                get: function get() {
                    return _get(Object.getPrototypeOf(Widget.prototype), "parent", this);
                }
            }]);

            return Widget;
        }(widget.EventDispatcher);

        widget.getWidget = function (element) {
            return element.__widgetWidget;
        };

        return widget;
    }
})();
//# sourceMappingURL=widget.babelized.js.map
