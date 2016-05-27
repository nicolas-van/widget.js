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
        var _ = require("lodash");
        var jquery = require("jquery")(w);
        return declare(w.document, _, jquery);
    };
} else { // define global variable 'widget'
    window.widget = declare(window.document, _, $);
}

function declare(document, _, $) {
    var CustomEvent = document.createEvent("CustomEvent").constructor;
    
    var widget = {};
    widget.internal = {};

    widget.LifeCycle = class LifeCycle {
        constructor(parent) {
            this.__lifeCycleMixin = true;
            this.__lifeCycleChildren = [];
            this.__lifeCycleParent = null;
            this.__lifeCycleDestroyed = false;
            this.setParent(parent);
        }
        getDestroyed() {
            return this.__lifeCycleDestroyed;
        }
        setParent(parent) {
            if (this.getParent()) {
                if (this.getParent().__lifeCycleMixin) {
                    this.getParent().__lifeCycleChildren = _.without(this
                            .getParent().getChildren(), this);
                }
            }
            this.__lifeCycleParent = parent;
            if (parent && parent.__lifeCycleMixin) {
                parent.__lifeCycleChildren.push(this);
            }
        }
        getParent() {
            return this.__lifeCycleParent;
        }
        getChildren() {
            return _.clone(this.__lifeCycleChildren);
        }
        destroy() {
            _.each(this.getChildren(), function(el) {
                el.destroy();
            });
            this.setParent(undefined);
            this.__lifeCycleDestroyed = true;
        }
    }
    
    widget.EventDispatcher = class EventDispatcher extends widget.LifeCycle {
        constructor(parent) {
            super(parent);
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
                    return this.removeEventListener(type, callback);
                }
            }
        }
        dispatchEvent(event) {
            var stack = this._listeners[event.type] || [];
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
                var ev = new CustomEvent(arg1, {detail: arg2});
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
        constructor(parent) {
            super(parent);
            this.__widgetAppended = false;
            this.__widgetElement = document.createElement(this.tagName());
            _.each(_.filter(this.className().split(" "), (name) => name !== ""), name => this.el.classList.add(name));
            _.each(this.attributes(), (val, key) => this.el.setAttribute(key, val));
            this.el.__widget_Widget = this;
    
            this.el.innerHtml = this.render();
        }
        get el() {
            return this.__widgetElement;
        }
        $(attr) {
            if (attr)
                return $(this.el).find.apply($(this.el), arguments);
            else
                return $(this.el);
        }
        destroy() {
            this.trigger("destroying");
            _.each(this.getChildren(), function(el) {
                el.destroy();
            });
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
            super.destroy();
        }
        appendTo(target) {
            this.$().appendTo($($(target)[0]));
            this.__checkAppended();
            return this;
        }
        prependTo(target) {
            this.$().prependTo($($(target)[0]));
            this.__checkAppended();
            return this;
        }
        insertAfter(target) {
            this.$().insertAfter($($(target)[0]));
            this.__checkAppended();
            return this;
        }
        insertBefore(target) {
            this.$().insertBefore($($(target)[0]));
            this.__checkAppended();
            return this;
        }
        replace(target) {
            this.$().replaceAll($($(target)[0]));
            this.__checkAppended();
            return this;
        }
        detach() {
            this.$().detach();
            this.__checkAppended();
            return this;
        }
        render() {
            return "";
        }
        get appendedToDom() {
            return this.__widgetAppended;
        }
        __checkAppended() {
            var inHtml = $.contains(document, this.$()[0]);
            if (this.__widgetAppended === inHtml)
                return;
            this.__widgetAppended = inHtml;
            this.trigger(inHtml ? "appendedToDom" : "removedFrgomDom");
            this.$("*").filter(function() { return widget.getWidget($(this)); }).each(function() {
                this.__widget_Widget.__widgetAppended = inHtml;
                this.__widget_Widget.trigger(inHtml ? "appendedToDom" : "removedFromDom");
            });
        }
    };
    
    widget.getWidget = function(element) {
        return element[0].__widget_Widget || null;
    };


    return widget;
}
})();
