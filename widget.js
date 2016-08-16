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

(function() {
"use strict";

if (typeof(exports) !== "undefined") { // node
    module.exports = function(w) {
        if (! w.document) {
            throw new Error( "widget.js requires a window with a document" );
        }
        return declare(w.document);
    };
} else { // define global variable 'widget'
    window.widget = declare(window.document);
}

function declare(document) {
    
    function matches(elm, selector) {
        if (elm.matches)
            return elm.matches(selector);
        if (elm.matchesSelector)
            return elm.matchesSelector(selector);
        var matches = (elm.document || elm.ownerDocument).querySelectorAll(selector),
            i = matches.length;
        while (--i >= 0 && matches.item(i) !== elm) {}
        return i > -1;
    }
    
    function addClass(el, name) {
        if (el.classList)
            el.classList.add(name);
        else
            el.className += " " + name;
    }
    
    var widget = {};
    
    widget.createCustomEvent = function(type, canBubble, cancelable, detail) {
        if (typeof CustomEvent === "function") {
            return new CustomEvent(type, {detail: detail, bubbles: canBubble || false,
                cancelable: cancelable || false});
        } else {
            var e = document.createEvent("CustomEvent");
            e.initCustomEvent(type, canBubble || false, cancelable || false, detail);
            if (cancelable) {
                // hack for IE due to a bug in that browser
                e.preventDefault = function () {
                    Object.defineProperty(this, "defaultPrevented", {get: function () {return true;}});
                };
            }
            return e;
        }
    }
    
    var Inheritable = function Inheritable() {};
    Inheritable.extend = function(protoProps) {
        var parent = this;
        var child;
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        } else {
            child = function() { return parent.apply(this, arguments); };
        }
        for (var key in parent) {
            if (! parent.hasOwnProperty(key))
                continue;
            child[key] = parent[key];
        }
        child.prototype = Object.create(parent.prototype);
        for (var key2 in protoProps) {
            var desc = Object.getOwnPropertyDescriptor(protoProps, key2);
            Object.defineProperty(child.prototype, key2, desc);
        }
        child.prototype.constructor = child;
        return child;
    };
    widget.Inheritable = Inheritable;

    var LifeCycle = Inheritable.extend({
        constructor: function LifeCycle() {
            Inheritable.apply(this, arguments);
            this.__lifeCycle = true;
            this.__lifeCycleChildren = [];
            this.__lifeCycleParent = null;
            this.__lifeCycleDestroyed = false;
        },
        get destroyed() {
            return this.__lifeCycleDestroyed;
        },
        set parent(parent) {
            if (this.parent && this.parent.__lifeCycle) {
                this.parent.__lifeCycleChildren = this.parent.children.filter(function(el) {
                    return el !== this;
                }.bind(this));
            }
            this.__lifeCycleParent = parent;
            if (parent && parent.__lifeCycle) {
                parent.__lifeCycleChildren.push(this);
            }
        },
        get parent() {
            return this.__lifeCycleParent;
        },
        get children() {
            return this.__lifeCycleChildren.slice();
        },
        destroy: function() {
            this.children.forEach(function(el) {
                el.destroy();
            });
            this.parent = undefined;
            this.__lifeCycleDestroyed = true;
        },
    });
    widget.LifeCycle = LifeCycle;
    
    var EventDispatcher = LifeCycle.extend({
        constructor: function EventDispatcher() {
            LifeCycle.call(this, arguments);
            this._listeners = [];
        },
        addEventListener: function(type, callback) {
            (this._listeners[type] = this._listeners[type] || []).push(callback);
        },
        removeEventListener: function(type, callback) {
            var stack = this._listeners[type] || [];
            for (var i = 0; i < stack.length; i++){
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                }
            }
        },
        dispatchEvent: function(event, overrideType) {
            var stack = this._listeners[overrideType || event.type] || [];
            for(var i = 0, l = stack.length; i < l; i++) {
                stack[i].call(this, event);
            }
        },
        on: function(arg1, arg2) {
            var events = {};
            if (typeof arg1 === "string") {
                events[arg1] = arg2;
            } else {
                events = arg1;
            }
            for (var key in events) {
                this.addEventListener(key, events[key]);
            }
            return this;
        },
        off: function(arg1, arg2) {
            var events = {};
            if (typeof arg1 === "string") {
                events[arg1] = arg2;
            } else {
                events = arg1;
            }
            for (var key in events) {
                this.removeEventListener(key, events[key]);
            }
            return this;
        },
        trigger: function(arg1, arg2) {
            if (arg1 instanceof Event) {
                this.dispatchEvent(arg1);
            } else {
                var ev = widget.createCustomEvent(arg1, false, false, arg2);
                this.dispatchEvent(ev);
            }
            return this;
        },
        destroy: function() {
            this._listeners = [];
            LifeCycle.prototype.destroy.call(this);
        },
    });
    widget.EventDispatcher = EventDispatcher;
    
    var getWidget = function(element) {
        return element.__widgetWidget;
    };
    widget.getWidget = getWidget;

    var Widget = EventDispatcher.extend({
        get tagName() { return 'div'; },
        get className() { return ''; },
        get attributes() { return {}; },
        constructor: function Widget() {
            EventDispatcher.call(this, arguments);
            this.__widgetAppended = false;
            this.__widgetExplicitParent = false;
            this.__widgetDomEvents = {};
            this.__widgetElement = document.createElement(this.tagName);
            this.className.split(" ").filter(function(name) { return name !== ""; }).forEach(function(name) {
                return addClass(this.el, name);
            }.bind(this));
            for (var key in this.attributes) this.el.setAttribute(key, this.attributes[key]);
            this.el.__widgetWidget = this;
            this.el.setAttribute("data-__widget", "");
    
            this.el.innerHTML = this.render();
        },
        get el() {
            return this.__widgetElement;
        },
        destroy: function() {
            this.trigger("destroying");
            this.children.forEach(function(el) {
                el.destroy();
            });
            if (this.el.parentNode)
                this.el.parentNode.removeChild(this.el);
            EventDispatcher.prototype.destroy.call(this);
        },
        appendTo: function(target) {
            target.appendChild(this.el);
            this.__checkAppended();
            return this;
        },
        prependTo: function(target) {
            target.insertBefore(this.el, target.firstChild);
            this.__checkAppended();
            return this;
        },
        insertAfter: function(target) {
            if (! target.nextSibling)
                target.parentNode.appendChild(this.el);
            else 
                target.parentNode.insertBefore(this.el, target.nextSibling);
            this.__checkAppended();
            return this;
        },
        insertBefore: function(target) {
            target.parentNode.insertBefore(this.el, target);
            this.__checkAppended();
            return this;
        },
        replace: function(target) {
            target.parentNode.replaceChild(this.el, target);
            this.__checkAppended();
            return this;
        },
        detach: function() {
            if (this.el.parentNode)
                this.el.parentNode.removeChild(this.el);
            this.__checkAppended();
            return this;
        },
        render: function() {
            return "";
        },
        addEventListener: function(type, callback) {
            EventDispatcher.prototype.addEventListener.call(this, type, callback);
            var res = /^dom:(\w+)(?: (.*))?$/.exec(type);
            if (! res)
                return;
            if (! this.__widgetDomEvents[type]) {
                var domCallback;
                if (! res[2]) {
                    domCallback = function(e) {
                        this.dispatchEvent(e, type);
                    }.bind(this);
                } else {
                    domCallback = function(e) {
                        var elem = e.target;
                        while (elem && elem !== this.el && ! matches(elem, res[2])) {
                            elem = elem.parentNode;
                        }
                        if (elem && elem !== this.el)
                            this.dispatchEvent(e, type);
                    }.bind(this);
                }
                this.el.addEventListener(res[1], domCallback);
                this.__widgetDomEvents[type] = [1, domCallback];
            } else {
                this.__widgetDomEvents[type][0] += 1;
            }
        },
        removeEventListener: function(type, callback) {
            EventDispatcher.prototype.removeEventListener.call(this, type, callback);
            var res = /^dom:(\w+)(?: (.*))?$/.exec(type);
            if (! res)
                return;
            if (! this.__widgetDomEvents[type])
                return;
            this.__widgetDomEvents[type][0] -= 1;
            if (this.__widgetDomEvents[type][0] === 0) {
                this.el.removeEventListener(res[1], this.__widgetDomEvents[type][1]);
                delete this.__widgetDomEvents[type];
            }
        },
        get appendedToDom() {
            return this.__widgetAppended;
        },
        set parent(parent) {
            Object.getOwnPropertyDescriptor(LifeCycle.prototype, 'parent').set.call(this, parent);
            this.__widgetExplicitParent = true;
        },
        get parent() {
            return Object.getOwnPropertyDescriptor(LifeCycle.prototype, 'parent').get.call(this);
        },
        resetParent: function() {
            this.__widgetExplicitParent = false;
            this.__checkAppended();
        },
        __checkAppended: function() {
            // check for parent change
            if (! this.__widgetExplicitParent) {
                var parent = this.el.parentNode;
                while (parent && ! getWidget(parent)) {
                    parent = parent.parentNode;
                }
                parent = parent ? getWidget(parent) : null;
                if (parent !== this.parent) {
                    this.parent = parent;
                    this.__widgetExplicitParent = false;
                }
            }
            
            // update appendedToDom and propagate to all sub elements
            var inHtml = document.body.contains(this.el);
            if (this.appendedToDom === inHtml)
                return;
            this.__widgetAppended = inHtml;
            this.trigger(inHtml ? "appendedToDom" : "removedFromDom");
            Array.prototype.forEach.call(this.el.querySelectorAll("[data-__widget]"), function(el) {
                getWidget(el).__widgetAppended = inHtml;
                getWidget(el).trigger(inHtml ? "appendedToDom" : "removedFromDom");
            });
        },
    });
    widget.Widget = Widget;
    
    var ready = function(callback) {
        if (document.readyState === "complete") {
            callback();
        } else {
            var c = function() {
                document.removeEventListener("DOMContentLoaded", c);
                callback();
            };
            document.addEventListener("DOMContentLoaded", c);
        }
    };
    widget.ready = ready;
    
    return widget;
}
})();
