
(function() {
"use strict";

/*if (typeof(module) !== "undefined") {
    global.assert = require("assert");
    var jsdom = require("jsdom").jsdom;
    var doc = jsdom();
    var window = doc.parentWindow;
    global.widget = require("./widget")(window);
}*/

suite("LifeCycle");

test("base", function() {
    var x = new widget.LifeCycle();
    assert.equal(!!x.destroyed, false);
    x.destroy();
    assert.equal(x.destroyed, true);
});

test("parents", function() {
    var x = new widget.LifeCycle();
    var y = new widget.LifeCycle();
    y.parent = x;
    assert.equal(y.parent, x);
    assert.equal(x.children[0], y);
    x.destroy();
    assert.equal(x.destroyed, true);
    assert.equal(y.destroyed, true);
});

suite("EventDispatcher");

test("base", function() {
    var x = new widget.EventDispatcher();
    var tmp = 0;
    var fct = function() {tmp = 1;};
    x.on("test", fct);
    assert.equal(tmp, 0);
    x.trigger("test");
    assert.equal(tmp, 1);
    tmp = 0;
    x.off("test", fct);
    x.trigger("test");
    assert.equal(tmp, 0);
    
    tmp = 0;
    var tmp2 = 0;
    var events = {
        test: fct,
        test2: function() { tmp2 = 1; },
    };
    x.on(events);
    x.trigger("test");
    assert.strictEqual(tmp, 1);
    assert.strictEqual(tmp2, 0);
    tmp = 0;
    x.trigger("test2");
    assert.strictEqual(tmp, 0);
    assert.strictEqual(tmp2, 1)
    tmp2 = 0;
    x.off(events);
    x.trigger("test");
    assert.strictEqual(tmp, 0);
    assert.strictEqual(tmp2, 0);
    x.trigger("test2");
    assert.strictEqual(tmp, 0);
    assert.strictEqual(tmp2, 0);
});

suite("Widget");

test("base", function() {
    class Claz extends widget.Widget {
        get tagName() { return "span"; }
        get className() { return "mytestspan"; }
        get attributes() {
            return {
                "id": "testspan"
            };
        }
        constructor() {
            super();
            this.el.innerHTML = "test";
        }
    };
    var x = new Claz();
    x.appendTo(document.querySelector("body"));
    var $el = $("#testspan");
    assert.strictEqual($el.length, 1);
    assert.strictEqual($el.parents()[0], $("body")[0]);
    assert.strictEqual($el.html(), "test");
    assert.strictEqual($el[0], $("span.mytestspan")[0]);
    x.detach();
    assert.strictEqual($(x.el).length, 1);
    assert.strictEqual($(x.el).parents().length, 0);
    assert.strictEqual($(x.el).html(), "test");
    assert.strictEqual($("span.mytestspan").length, 0);
    x.prependTo(document.querySelector("body"));
    $el = $("#testspan");
    assert.strictEqual($el.length, 1);
    assert.strictEqual($el.parents()[0], $("body")[0]);
    assert.strictEqual($el.html(), "test");
    assert.strictEqual($el[0], $("span.mytestspan")[0]);
    x.detach();
    $("<div class='testdiv'></div>").appendTo("body");
    x.insertAfter(document.querySelector(".testdiv"));
    $el = $("#testspan");
    assert.strictEqual($el.length, 1);
    assert.strictEqual($el.parents()[0], $("body")[0]);
    assert.strictEqual($el.html(), "test");
    assert.strictEqual($el[0], $("span.mytestspan")[0]);
    x.detach();
    x.insertBefore(document.querySelector(".testdiv"));
    $el = $("#testspan");
    assert.strictEqual($el.length, 1);
    assert.strictEqual($el.parents()[0], $("body")[0]);
    assert.strictEqual($el.html(), "test");
    assert.strictEqual($el[0], $("span.mytestspan")[0]);
    x.detach();
    x.replace(document.querySelector(".testdiv"));
    $el = $("#testspan");
    assert.strictEqual($el.length, 1);
    assert.strictEqual($el.parents()[0], $("body")[0]);
    assert.strictEqual($el.html(), "test");
    assert.strictEqual($el[0], $("span.mytestspan")[0]);
    
    var y = new Claz();
    y.parent = x;
    assert.strictEqual(y.parent, x);
    
    x.destroy();
    $el = $("#testspan");
    assert.strictEqual($el.length, 0);
});

test("appendEvents", function() {
    var x = new widget.Widget();
    var y = new widget.Widget();
    assert.strictEqual(x.__widgetAppended, false);
    assert.strictEqual(y.__widgetAppended, false);
    y.appendTo(x.el);
    assert.strictEqual(x.__widgetAppended, false);
    assert.strictEqual(y.__widgetAppended, false);
    x.appendTo(document.querySelector("body"));
    assert.strictEqual(x.__widgetAppended, true);
    assert.strictEqual(y.__widgetAppended, true);
    y.detach();
    assert.strictEqual(x.__widgetAppended, true);
    assert.strictEqual(y.__widgetAppended, false);
    y.appendTo(x.el);
    assert.strictEqual(x.__widgetAppended, true);
    assert.strictEqual(y.__widgetAppended, true);
    x.detach();
    assert.strictEqual(x.__widgetAppended, false);
    assert.strictEqual(y.__widgetAppended, false);
    
    x.destroy();
    y.destroy();
});

test("autoParent", function() {
    class Claz extends widget.Widget {
        constructor() {
            super();
            this.el.innerHTML = "<div></div>";
        }
    };
    var x = new Claz();
    assert.strictEqual(x.parent, null);
    var y = new widget.Widget();
    assert.strictEqual(y.parent, null);
    
    y.appendTo(x.el.querySelector("div"));
    assert.strictEqual(x.parent, null);
    assert.strictEqual(y.parent, x);
    y.detach();
    assert.strictEqual(x.parent, null);
    assert.strictEqual(y.parent, null);
    
    var l = new widget.LifeCycle();
    y.parent = l;
    assert.strictEqual(y.parent, l);
    y.appendTo(x.el.querySelector("div"));
    assert.strictEqual(y.parent, l);
    y.resetParent();
    assert.strictEqual(y.parent, x);
});

test("domEventsSimple", function() {
    var x = new widget.Widget();
    x.appendTo($("body")[0]);
    var tmp = 0;
    x.on("dom:click", function(e) {
        assert.strictEqual(this, x);
        assert.strictEqual(e.target, x.el);
        tmp = 1;
    });
    x.el.click();
    assert.strictEqual(tmp, 1);
    x.destroy();
});

test("domEventsBubbling", function() {
    class Claz extends widget.Widget {
        constructor() {
            super();
            this.el.innerHTML = "<p><button></button></p>";
        }
    };
    var x = new Claz();
    x.appendTo($("body")[0]);
    var tmp = 0;
    var event = function(e) {
        assert.strictEqual(this, x);
        assert.strictEqual(e.target, x.el.querySelector("button"));
        tmp = 1;
    };
    x.on("dom:click button", event);
    assert.notEqual(x.__widgetDomEvents["dom:click button"], undefined);
    x.el.querySelector("button").click();
    assert.strictEqual(tmp, 1);
    tmp = 0;
    x.off("dom:click button", event);
    assert.equal(x.__widgetDomEvents["dom:click button"], undefined);
    x.el.querySelector("button").click();
    assert.strictEqual(tmp, 0);
    
    tmp = 0;
    event = function(e) {
        assert.strictEqual(this, x);
        assert.strictEqual(e.target, x.el.querySelector("button"));
        tmp = 1;
    };
    x.on("dom:click p", event);
    assert.notEqual(x.__widgetDomEvents["dom:click p"], undefined);
    x.el.querySelector("button").click();
    assert.strictEqual(tmp, 1);
    tmp = 0;
    x.off("dom:click p", event);
    assert.equal(x.__widgetDomEvents["dom:click p"], undefined);
    x.el.querySelector("button").click();
    assert.strictEqual(tmp, 0);
    
    tmp = 0;
    event = function(e) {
        tmp = 1;
    };
    x.on("dom:click button", event);
    assert.notEqual(x.__widgetDomEvents["dom:click button"], undefined);
    x.el.querySelector("p").click();
    assert.strictEqual(tmp, 0);
    
    x.destroy();
});

test("render", function() {
    class Claz extends widget.Widget {
        render() {
            return "test";
        }
    };
    var x = new Claz();
    assert.strictEqual(x.el.innerText, "test");
});

$(function() {
    test("ready", function() {
        var tmp = 0;
        widget.ready(function() { tmp = 1; });
        assert.strictEqual(tmp, 1);
    });
})

})();
