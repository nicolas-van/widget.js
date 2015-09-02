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
        var und = require("underscore");
        var jq = require("jquery")(w);
        var rg = require("ring");
        return declare(w.document, jq, und, rg);
    };
} else { // define global variable 'widget'
    window.widget = declare(window.document, $, _, ring);
}

function declare(document, $, _, ring) {
    var widget = {};
    widget.internal = {};

    widget.LifeCycle = ring.create({
        __lifeCycleMixin : true,
        constructor: function(parent) {
            this.$super();
            this.__lifeCycleChildren = [];
            this.__lifeCycleParent = null;
            this.__lifeCycleDestroyed = false;
            this.setParent(parent);
        },
        getDestroyed : function() {
            return this.__lifeCycleDestroyed;
        },
        setParent : function(parent) {
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
        },
        getParent : function() {
            return this.__lifeCycleParent;
        },
        getChildren : function() {
            return _.clone(this.__lifeCycleChildren);
        },
        destroy : function() {
            _.each(this.getChildren(), function(el) {
                el.destroy();
            });
            this.setParent(undefined);
            this.__lifeCycleDestroyed = true;
        }
    });

    // (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
    // Backbone may be freely distributed under the MIT license.
    // For all details and documentation:
    // http://backbonejs.org
    widget.internal.Events = ring.create({
        on : function(events, callback, context) {
            var ev;
            events = events.split(/\s+/);
            var calls = this._callbacks || (this._callbacks = {});
            while ((ev = events.shift())) {
                var list = calls[ev] || (calls[ev] = {});
                var tail = list.tail || (list.tail = list.next = {});
                tail.callback = callback;
                tail.context = context;
                list.tail = tail.next = {};
            }
            return this;
        },
        off : function(events, callback, context) {
            var ev, calls, node;
            if (!events) {
                delete this._callbacks;
            } else if ((calls = this._callbacks)) {
                events = events.split(/\s+/);
                while ((ev = events.shift())) {
                    node = calls[ev];
                    delete calls[ev];
                    if (!callback || !node)
                        continue;
                    while ((node = node.next) && node.next) {
                        if (node.callback === callback &&
                                (!context || node.context === context))
                            continue;
                        this.on(ev, node.callback, node.context);
                    }
                }
            }
            return this;
        },
        callbackList: function() {
            var lst = [];
            _.each(this._callbacks || {}, function(el, eventName) {
                var node = el;
                while ((node = node.next) && node.next) {
                    lst.push([eventName, node.callback, node.context]);
                }
            });
            return lst;
        },
        trigger : function(events) {
            var event, node, calls, tail, args, all, rest;
            if (!(calls = this._callbacks))
                return this;
            all = calls.all;
            (events = events.split(/\s+/)).push(null);
            // Save references to the current heads & tails.
            while ((event = events.shift())) {
                if (all)
                    events.push({
                        next : all.next,
                        tail : all.tail,
                        event : event
                    });
                if (!(node = calls[event]))
                    continue;
                events.push({
                    next : node.next,
                    tail : node.tail
                });
            }
            rest = Array.prototype.slice.call(arguments, 1);
            while ((node = events.pop())) {
                tail = node.tail;
                args = node.event ? [ node.event ].concat(rest) : rest;
                while ((node = node.next) !== tail) {
                    node.callback.apply(node.context, args);
                }
            }
            return this;
        }
    });
    // end of Backbone's events class
    
    widget.EventDispatcher = ring.create({
        events: {},
        classInit: function(proto) {
            var eventsDicts = _.chain(proto.constructor.__mro__).pluck("__properties__").pluck("events").compact()
                .reverse().value();
            proto.__eventDispatcherStaticEvents = [];
            _.each(eventsDicts, function(dct) {
                _.each(dct, function(val, key) {
                    proto.__eventDispatcherStaticEvents.push([key, val]);
                });
            });
        },
        constructor: function(parent) {
            this.$super(parent);
            this.__edispatcherEvents = new widget.internal.Events();
            _.each(this.__eventDispatcherStaticEvents, _.bind(function(el) {
                this.on(el[0], typeof el[1] === "string" ? this[el[1]] : el[1], this);
            }, this));
        },
        on: function(events, func, context) {
            this.__edispatcherEvents.on(events, func, context);
            return this;
        },
        off: function(events, func, context) {
            this.__edispatcherEvents.off(events, func, context);
            return this;
        },
        trigger: function() {
            this.__edispatcherEvents.trigger.apply(this.__edispatcherEvents, arguments);
            return this;
        }
    });
    
    widget.Properties = widget.EventDispatcher.$extend({
        classInit: function(proto) {
            var flat = _.extend({}, proto);
            var props = {};
            _.each(flat, function(v, k) {
                if (typeof v === "function") {
                    var res = /^((?:get)|(?:set))([A-Z]\w*)$/.exec(k);
                    if (! res)
                        return;
                    var name = res[2][0].toLowerCase() + res[2].slice(1);
                    var prop = props[name] || (props[name] = {});
                    prop[res[1]] = v;
                }
            });
            proto.__properties = props;
        },
        constructor: function(parent) {
            this.$super(parent);
            this.__dynamicProperties = {};
        },
        set: function(arg1, arg2) {
            var self = this;
            var map;
            if (typeof arg1 === "string") {
                map = {};
                map[arg1] = arg2;
            } else {
                map = arg1;
            }
            _.each(map, function(val, key) {
                var prop = self.__properties[key];
                if (prop) {
                    if (! prop.set)
                        throw new ring.ValueError("Property " + key + " does not have a setter method.");
                    prop.set.call(self, val);
                } else {
                    self._fallbackSet(key, val);
                }
            });
        },
        get: function(key) {
            var prop = this.__properties[key];
            if (prop) {
                if (! prop.get)
                    throw new ring.ValueError("Property " + key + " does not have a getter method.");
                return prop.get.call(this);
            } else {
                return this._fallbackGet(key);
            }
        },
        _fallbackSet: function(key, val) {
            var tmp = this.__dynamicProperties[key];
            if (tmp === val)
                return;
            this.__dynamicProperties[key] = val;
            this.trigger("change:" + key, this, {
                oldValue: tmp,
                newValue: val
            });
        },
        _fallbackGet: function(key) {
            return this.__dynamicProperties[key];
        }
    });
    
    widget.Widget = ring.create([widget.LifeCycle, widget.Properties], {
        tagName: 'div',
        className: '',
        attributes: {},
        domEvents: {},
        classInit: function(proto) {
            var eventsDicts = _.chain(proto.constructor.__mro__).pluck("__properties__").pluck("domEvents").compact()
                .reverse().value();
            proto.__widgetStaticEvents = [];
            _.each(eventsDicts, function(dct) {
                _.each(dct, function(val, key) {
                    proto.__widgetStaticEvents.push([key, val]);
                });
            });
        },
        constructor: function(parent) {
            this.$super(parent);
            this.__widgetAppended = false;
            this.__widgetElement = $("<" + this.tagName + ">");
            this.$().addClass(this.className);
            _.each(this.attributes, function(val, key) {
                this.$().attr(key, val);
            }, this);
            this.$().data("widgetWidget", this);
            _.each(this.__widgetStaticEvents, function(el) {
                var key = el[0];
                var val = el[1];
                key = key.split(" ");
                val = _.bind(typeof val === "string" ? this[val] : val, this);
                if (key.length > 1) {
                    this.$().on(key[0], key[1], val);
                } else {
                    this.$().on(key[0], val);
                }
            }, this);
    
            this.setParent(parent);
            this.$().html(this.render());
        },
        $: function(attr) {
            if (attr)
                return this.__widgetElement.find.apply(this.__widgetElement, arguments);
            else
                return this.__widgetElement;
        },
        destroy: function() {
            this.trigger("destroying");
            _.each(this.getChildren(), function(el) {
                el.destroy();
            });
            this.off();
            this.$().remove();
            this.$super();
        },
        appendTo: function(target) {
            this.$().appendTo($($(target)[0]));
            this.__checkAppended();
            return this;
        },
        prependTo: function(target) {
            this.$().prependTo($($(target)[0]));
            this.__checkAppended();
            return this;
        },
        insertAfter: function(target) {
            this.$().insertAfter($($(target)[0]));
            this.__checkAppended();
            return this;
        },
        insertBefore: function(target) {
            this.$().insertBefore($($(target)[0]));
            this.__checkAppended();
            return this;
        },
        replace: function(target) {
            this.$().replaceAll($($(target)[0]));
            this.__checkAppended();
            return this;
        },
        detach: function() {
            this.$().detach();
            this.__checkAppended();
            return this;
        },
        render: function() {
            return "";
        },
        getAppendedToDom: function() {
            return this.__widgetAppended;
        },
        __checkAppended: function() {
            var inHtml = $.contains(document, this.$()[0]);
            if (this.__widgetAppended === inHtml)
                return;
            this.__widgetAppended = inHtml;
            this.trigger(inHtml ? "appendedToDom" : "removedFromDom");
            this.$("*").filter(function() { return widget.getWidget($(this)); }).each(function() {
                $(this).data("widgetWidget").__widgetAppended = inHtml;
                $(this).data("widgetWidget").trigger(inHtml ? "appendedToDom" : "removedFromDom");
            });
        }
    });
    
    widget.getWidget = function(element) {
        return element.data("widgetWidget") || null;
    };

    return widget;
}
})();
