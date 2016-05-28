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
    function createCustomEvent(type, detail) {
        if (typeof CustomEvent === "function") {
            return new CustomEvent(type, {detail: detail});
        } else {
            var e = document.createEvent("CustomEvent");
            e.initCustomEvent(type, false, false, detail);
            return e;
        }
    }
    
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
    
    var widget = {};
    widget.internal = {};

    widget.LifeCycle = class LifeCycle {
        constructor() {
            this.__lifeCycle = true;
            this.__lifeCycleChildren = [];
            this.__lifeCycleParent = null;
            this.__lifeCycleDestroyed = false;
        }
        get destroyed() {
            return this.__lifeCycleDestroyed;
        }
        set parent(parent) {
            if (this.parent && this.parent.__lifeCycle) {
                this.parent.__lifeCycleChildren = this.parent.children.filter((el) => el !== this);
            }
            this.__lifeCycleParent = parent;
            if (parent && parent.__lifeCycle) {
                parent.__lifeCycleChildren.push(this);
            }
        }
        get parent() {
            return this.__lifeCycleParent;
        }
        get children() {
            return this.__lifeCycleChildren.slice();
        }
        destroy() {
            this.children.forEach(function(el) {
                el.destroy();
            });
            this.parent = undefined;
            this.__lifeCycleDestroyed = true;
        }
    };
    
    widget.EventDispatcher = class EventDispatcher extends widget.LifeCycle {
        constructor() {
            super();
            this._listeners = [];
        }
        addEventListener(type, callback) {
            (this._listeners[type] = this._listeners[type] || []).push(callback);
        }
        removeEventListener(type, callback) {
            var stack = this._listeners[type] || [];
            for (var i = 0; i < stack.length; i++){
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                }
            }
        }
        dispatchEvent(event, overrideType) {
            var stack = this._listeners[overrideType || event.type] || [];
            for(var i = 0, l = stack.length; i < l; i++) {
                stack[i].call(this, event);
            }
        }
        on(type, func) {
            this.addEventListener(type, func);
            return this;
        }
        off(type, func) {
            this.removeEventListener(type, func);
            return this;
        }
        trigger(arg1, arg2) {
            if (arg1 instanceof Event) {
                this.dispatchEvent(arg1);
            } else {
                var ev = createCustomEvent(arg1, arg2);
                this.dispatchEvent(ev);
            }
            return this;
        }
        destroy() {
            this._listeners = [];
            super.destroy();
        }
    };

    widget.Widget = class Widget extends widget.EventDispatcher {
        tagName() { return 'div'; }
        className() { return ''; }
        attributes() { return {}; }
        constructor() {
            super();
            this.__widgetAppended = false;
            this.__widgetExplicitParent = false;
            this.__widgetDomEvents = {};
            this.__widgetElement = document.createElement(this.tagName());
            this.className().split(" ").filter((name) => name !== "").forEach(name => this.el.classList.add(name));
            var atts = this.attributes();
            for (var key in atts) this.el.setAttribute(key, atts[key]);
            this.el.__widgetWidget = this;
            this.el.dataset.__widget = "";
    
            this.el.innerHTML = this.render();
        }
        get el() {
            return this.__widgetElement;
        }
        destroy() {
            this.trigger("destroying");
            this.children.forEach(function(el) {
                el.destroy();
            });
            if (this.el.parentNode)
                this.el.parentNode.removeChild(this.el);
            super.destroy();
        }
        appendTo(target) {
            target.insertBefore(this.el, null);
            this.__checkAppended();
            return this;
        }
        prependTo(target) {
            target.insertBefore(this.el, target.firstChild);
            this.__checkAppended();
            return this;
        }
        insertAfter(target) {
            target.parentNode.insertBefore(this.el, target.nextSibling);
            this.__checkAppended();
            return this;
        }
        insertBefore(target) {
            target.parentNode.insertBefore(this.el, target);
            this.__checkAppended();
            return this;
        }
        replace(target) {
            target.parentNode.replaceChild(this.el, target);
            this.__checkAppended();
            return this;
        }
        detach() {
            if (this.el.parentNode)
                this.el.parentNode.removeChild(this.el);
            this.__checkAppended();
            return this;
        }
        render() {
            return "";
        }
        addEventListener(type, callback) {
            super.addEventListener(type, callback);
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
        }
        removeEventListener(type, callback) {
            super.removeEventListener(type, callback);
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
        }
        get appendedToDom() {
            return this.__widgetAppended;
        }
        set parent(parent) {
            super.parent = parent;
            this.__widgetExplicitParent = true;
        }
        get parent() {
            return super.parent;
        }
        resetParent() {
            this.__widgetExplicitParent = false;
            this.__checkAppended();
        }
        __checkAppended() {
            // check for parent change
            if (! this.__widgetExplicitParent) {
                var parent = this.el.parentNode;
                while (parent && ! (parent.dataset && parent.dataset.__widget !== undefined)) {
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
            if (this.appendedToDom === inHtml)
                return;
            this.__widgetAppended = inHtml;
            this.trigger(inHtml ? "appendedToDom" : "removedFromDom");
            Array.prototype.forEach.call(this.el.querySelectorAll("[data-__widget]"), function(el) {
                widget.getWidget(el).__widgetAppended = inHtml;
                widget.getWidget(el).trigger(inHtml ? "appendedToDom" : "removedFromDom");
            });
        }
    };
    
    widget.getWidget = function(element) {
        return element.__widgetWidget;
    };


    return widget;
}
})();
