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
            throw new Error( "Spear.js requires a window with a document" );
        }
        var und = require("underscore");
        var jq = require("jquery")(w);
        var rg = require("ring");
        return declare(w.document, jq, und, rg);
    };
} else { // define global variable 'spear'
    window.spear = declare(window.document, $, _, ring);
}

function declare(document, $, _, ring) {
    var spear = {};
    spear.internal = {};

    spear.$ = $;

    /**
     * Mixin to express the concept of destroying an object.
     * When an object is destroyed, it should release any resource
     * it could have reserved before.
     */
    spear.Destroyable = ring.create({
        constructor: function() {
            this.__destroyableDestroyed = false;
        },
        /**
         * Returns true if destroy() was called on the current object.
         */
        isDestroyed : function() {
            return this.__destroyableDestroyed;
        },
        /**
         * Inform the object it should destroy itself, releasing any
         * resource it could have reserved.
         */
        destroy : function() {
            this.__destroyableDestroyed = true;
        }
    });

    /**
     * Mixin to structure objects' life-cycles folowing a parent-children
     * relationship. Each object can a have a parent and multiple children.
     * When an object is destroyed, all its children are destroyed too.
     */
    spear.Parented = ring.create([spear.Destroyable], {
        __parentedMixin : true,
        constructor: function(parent) {
            this.$super();
            this.__parentedChildren = [];
            this.__parentedParent = null;
            this.setParent(parent);
        },
        /**
         * Set the parent of the current object. When calling this method, the
         * parent will also be informed and will return the current object
         * when its getChildren() method is called. If the current object did
         * already have a parent, it is unregistered before, which means the
         * previous parent will not return the current object anymore when its
         * getChildren() method is called.
         */
        setParent : function(parent) {
            if (this.getParent()) {
                if (this.getParent().__parentedMixin) {
                    this.getParent().__parentedChildren = _.without(this
                            .getParent().getChildren(), this);
                }
            }
            this.__parentedParent = parent;
            if (parent && parent.__parentedMixin) {
                parent.__parentedChildren.push(this);
            }
        },
        /**
         * Return the current parent of the object (or null).
         */
        getParent : function() {
            return this.__parentedParent;
        },
        /**
         * Return a list of the children of the current object.
         */
        getChildren : function() {
            return _.clone(this.__parentedChildren);
        },
        destroy : function() {
            _.each(this.getChildren(), function(el) {
                el.destroy();
            });
            this.setParent(undefined);
            this.$super();
        }
    });

    /*
     * Yes, we steal Backbone's events :)
     * 
     * This class just handle the dispatching of events, it is not meant to be extended,
     * nor used directly. All integration with parenting and automatic unregistration of
     * events is done in the EventDispatcher class.
     */
    // (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
    // Backbone may be freely distributed under the MIT license.
    // For all details and documentation:
    // http://backbonejs.org
    spear.internal.Events = ring.create({
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
    
    spear.EventDispatcher = ring.create([spear.Parented], {
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
            this.__edispatcherEvents = new spear.internal.Events();
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
        },
        destroy: function() {
            this.__edispatcherEvents.off();
            this.$super();
        }
    });
    
    spear.Properties = ring.create([spear.EventDispatcher], {
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
                        throw new ring.InvalidArgumentError("Property " + key + " does not have a setter method.");
                    prop.set.call(self, val);
                } else {
                    self.fallbackSet(key, val);
                }
            });
        },
        get: function(key) {
            var prop = this.__properties[key];
            if (prop) {
                if (! prop.get)
                    throw new ring.InvalidArgumentError("Property " + key + " does not have a getter method.");
                return prop.get.call(this);
            } else {
                return this.fallbackGet(key);
            }
        },
        fallbackSet: function(key, val) {
            throw new ring.InvalidArgumentError("Property " + key + " is not defined.");
        },
        fallbackGet: function(key) {
            throw new ring.InvalidArgumentError("Property " + key + " is not defined.");
        },
        trigger: function(name) {
            this.$super.apply(this, arguments);
        }
    });

    spear.DynamicProperties = ring.create([spear.Properties], {
        constructor: function(parent) {
            this.$super(parent);
            this.__dynamicProperties = {};
        },
        fallbackSet: function(key, val) {
            var tmp = this.__dynamicProperties[key];
            if (tmp === val)
                return;
            this.__dynamicProperties[key] = val;
            this.trigger("change:" + key, this, {
                oldValue: tmp,
                newValue: val
            });
        },
        fallbackGet: function(key) {
            return this.__dynamicProperties[key];
        }
    });
    
    spear.Widget = ring.create([spear.DynamicProperties], {
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
            this.__widgetElement = $("<" + this.tagName + ">");
            this.$().addClass(this.className);
            _.each(this.attributes, function(val, key) {
                this.$().attr(key, val);
            }, this);
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
        },
        $: function(attr) {
            if (attr)
                return this.__widgetElement.find.apply(this.__widgetElement, arguments);
            else
                return this.__widgetElement;
        },
        /**
         * Destroys the current widget, also destroys all its children before destroying itself.
         */
        destroy: function() {
            _.each(this.getChildren(), function(el) {
                el.destroy();
            });
            this.$().remove();
            this.$super();
        },
        /**
         * Renders the current widget and appends it to the given jQuery object or Widget.
         *
         * @param target A jQuery object or a Widget instance.
         */
        appendTo: function(target) {
            this.$().appendTo(target);
            return this.render();
        },
        /**
         * Renders the current widget and prepends it to the given jQuery object or Widget.
         *
         * @param target A jQuery object or a Widget instance.
         */
        prependTo: function(target) {
            this.$().prependTo(target);
            return this.render();
        },
        /**
         * Renders the current widget and inserts it after to the given jQuery object or Widget.
         *
         * @param target A jQuery object or a Widget instance.
         */
        insertAfter: function(target) {
            this.$().insertAfter(target);
            return this.render();
        },
        /**
         * Renders the current widget and inserts it before to the given jQuery object or Widget.
         *
         * @param target A jQuery object or a Widget instance.
         */
        insertBefore: function(target) {
            this.$().insertBefore(target);
            return this.render();
        },
        /**
         * Renders the current widget and replaces the given jQuery object.
         *
         * @param target A jQuery object or a Widget instance.
         */
        replace: function(target) {
            this.$().replace(target);
            return this.render();
        },
        /**
         * This is the method to implement to render the Widget.
         */
        render: function() {}
    });

    return spear;
}
})();
