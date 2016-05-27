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
        return declare(w.document, _);
    };
} else { // define global variable 'widget'
    window.widget = declare(window.document, _);
}

function declare(document, _) {
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

    // (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
    // Backbone may be freely distributed under the MIT license.
    // For all details and documentation:
    // http://backbonejs.org
    widget.internal.Events = class Events {
        on(events, callback, context) {
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
        }
        off(events, callback, context) {
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
        }
        callbackList() {
            var lst = [];
            _.each(this._callbacks || {}, function(el, eventName) {
                var node = el;
                while ((node = node.next) && node.next) {
                    lst.push([eventName, node.callback, node.context]);
                }
            });
            return lst;
        }
        trigger(events) {
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
    };
    // end of Backbone's events class

    widget.EventDispatcher = class EventDispatcher extends widget.LifeCycle {
        constructor(parent) {
            super(parent);
            this.__edispatcherEvents = new widget.internal.Events();
        }
        on(events, func, context) {
            this.__edispatcherEvents.on(events, func, context);
            return this;
        }
        off(events, func, context) {
            this.__edispatcherEvents.off(events, func, context);
            return this;
        }
        trigger() {
            this.__edispatcherEvents.trigger.apply(this.__edispatcherEvents, arguments);
            return this;
        }
    }

    widget.Properties = class Properties extends widget.EventDispatcher {
        constructor(parent) {
            super(parent);
            this.__dynamicProperties = {};
        }
        set(arg1, arg2) {
            var map;
            if (typeof arg1 === "string") {
                map = {};
                map[arg1] = arg2;
            } else {
                map = arg1;
            }
            _.each(map, _.bind(function(val, key) {
                var tmp = this.__dynamicProperties[key];
                if (tmp === val)
                    return;
                this.__dynamicProperties[key] = val;
                this.trigger("change:" + key, this, {
                    oldValue: tmp,
                    newValue: val
                });
            }, this));
        }
        get(key) {
            return this.__dynamicProperties[key];
        }
    };
/*
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
*/
    return widget;
}
})();
