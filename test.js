
var widgetjs = require('./dist/widgetjs.bundle.js');
var $ = require('jquery');
var legado = require('legado').default;

describe("LifeCycle", () => {
  test("base", function() {
    var x = new widgetjs.LifeCycle();
    expect(!!x.destroyed).toBe(false);
    x.destroy();
    expect(x.destroyed).toBe(true);
  });

  test("parents", function() {
    var x = new widgetjs.LifeCycle();
    var y = new widgetjs.LifeCycle();
    y.parent = x;
    expect(y.parent).toBe(x);
    expect(x.children[0]).toBe(y);
    x.destroy();
    expect(x.destroyed).toBe(true);
    expect(y.destroyed).toBe(true);
  });
});

describe("EventDispatcher", () => {
  test("base", function() {
    var x = new widgetjs.EventDispatcher();
    var tmp = 0;
    var fct = function() {tmp = 1;};
    x.on("test", fct);
    expect(tmp).toBe(0);
    x.trigger("test");
    expect(tmp).toBe(1);
    tmp = 0;
    x.off("test", fct);
    x.trigger("test");
    expect(tmp).toBe(0);

    tmp = 0;
    var tmp2 = 0;
    var events = {
      test: fct,
      test2: function() { tmp2 = 1; },
    };
    x.on(events);
    x.trigger("test");
    expect(tmp).toBe(1);
    expect(tmp2).toBe(0);
    tmp = 0;
    x.trigger("test2");
    expect(tmp).toBe(0);
    expect(tmp2).toBe(1)
    tmp2 = 0;
    x.off(events);
    x.trigger("test");
    expect(tmp).toBe(0);
    expect(tmp2).toBe(0);
    x.trigger("test2");
    expect(tmp).toBe(0);
    expect(tmp2).toBe(0);
  });
});

describe("Widget", () => {

  test("base", function() {
    class Claz extends widgetjs.Widget {
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
    expect($el.length).toBe(1);
    expect($el.parents()[0]).toBe($("body")[0]);
    expect($el.html()).toBe("test");
    expect($el[0]).toBe($("span.mytestspan")[0]);
    x.detach();
    expect($(x.el).length).toBe(1);
    expect($(x.el).parents().length).toBe(0);
    expect($(x.el).html()).toBe("test");
    expect($("span.mytestspan").length).toBe(0);
    x.prependTo(document.querySelector("body"));
    $el = $("#testspan");
    expect($el.length).toBe(1);
    expect($el.parents()[0]).toBe($("body")[0]);
    expect($el.html()).toBe("test");
    expect($el[0]).toBe($("span.mytestspan")[0]);
    x.detach();
    $("<div class='testdiv'></div>").appendTo("body");
    x.insertAfter(document.querySelector(".testdiv"));
    $el = $("#testspan");
    expect($el.length).toBe(1);
    expect($el.parents()[0]).toBe($("body")[0]);
    expect($el.html()).toBe("test");
    expect($el[0]).toBe($("span.mytestspan")[0]);
    x.detach();
    x.insertBefore(document.querySelector(".testdiv"));
    $el = $("#testspan");
    expect($el.length).toBe(1);
    expect($el.parents()[0]).toBe($("body")[0]);
    expect($el.html()).toBe("test");
    expect($el[0]).toBe($("span.mytestspan")[0]);
    x.detach();
    x.replace(document.querySelector(".testdiv"));
    $el = $("#testspan");
    expect($el.length).toBe(1);
    expect($el.parents()[0]).toBe($("body")[0]);
    expect($el.html()).toBe("test");
    expect($el[0]).toBe($("span.mytestspan")[0]);

    var y = new Claz();
    y.parent = x;
    expect(y.parent).toBe(x);

    x.destroy();
    $el = $("#testspan");
    expect($el.length).toBe(0);
  });

  test("appendEvents", function() {
    var x = new widgetjs.Widget();
    var y = new widgetjs.Widget();
    expect(x.__widgetAppended).toBe(false);
    expect(y.__widgetAppended).toBe(false);
    y.appendTo(x.el);
    expect(x.__widgetAppended).toBe(false);
    expect(y.__widgetAppended).toBe(false);
    x.appendTo(document.querySelector("body"));
    expect(x.__widgetAppended).toBe(true);
    expect(y.__widgetAppended).toBe(true);
    y.detach();
    expect(x.__widgetAppended).toBe(true);
    expect(y.__widgetAppended).toBe(false);
    y.appendTo(x.el);
    expect(x.__widgetAppended).toBe(true);
    expect(y.__widgetAppended).toBe(true);
    x.detach();
    expect(x.__widgetAppended).toBe(false);
    expect(y.__widgetAppended).toBe(false);

    x.destroy();
    y.destroy();
  });

  test("autoParent", function() {
    class Claz extends widgetjs.Widget {
      constructor() {
        super();
        this.el.innerHTML = "<div></div>";
      }
    };
    var x = new Claz();
    expect(x.parent).toBe(null);
    var y = new widgetjs.Widget();
    expect(y.parent).toBe(null);

    y.appendTo(x.el.querySelector("div"));
    expect(x.parent).toBe(null);
    expect(y.parent).toBe(x);
    y.detach();
    expect(x.parent).toBe(null);
    expect(y.parent).toBe(null);

    var l = new widgetjs.LifeCycle();
    y.parent = l;
    expect(y.parent).toBe(l);
    y.appendTo(x.el.querySelector("div"));
    expect(y.parent).toBe(l);
    y.resetParent();
    expect(y.parent).toBe(x);
  });

  test("domEventsSimple", function() {
    var x = new widgetjs.Widget();
    x.appendTo($("body")[0]);
    var tmp = 0;
    x.on("dom:click", function(e) {
      expect(this).toBe(x);
      expect(e.target).toBe(x.el);
      tmp = 1;
    });
    x.el.click();
    expect(tmp).toBe(1);
    x.destroy();
  });

  test("domEventsBubbling", function() {
    class Claz extends widgetjs.Widget {
      constructor() {
        super();
        this.el.innerHTML = "<p><button></button></p>";
      }
    };
    var x = new Claz();
    x.appendTo($("body")[0]);
    var tmp = 0;
    var event = function(e) {
      expect(this).toBe(x);
      expect(e.target).toBe(x.el.querySelector("button"));
      tmp = 1;
    };
    x.on("dom:click button", event);
    expect(x.__widgetDomEvents["dom:click button"]).not.toBe(undefined);
    x.el.querySelector("button").click();
    expect(tmp).toBe(1);
    tmp = 0;
    x.off("dom:click button", event);
    expect(x.__widgetDomEvents["dom:click button"]).toBe(undefined);
    x.el.querySelector("button").click();
    expect(tmp).toBe(0);

    tmp = 0;
    event = function(e) {
      expect(this).toBe(x);
      expect(e.target).toBe(x.el.querySelector("button"));
      tmp = 1;
    };
    x.on("dom:click p", event);
    expect(x.__widgetDomEvents["dom:click p"]).not.toBe(undefined);
    x.el.querySelector("button").click();
    expect(tmp).toBe(1);
    tmp = 0;
    x.off("dom:click p", event);
    expect(x.__widgetDomEvents["dom:click p"]).toBe(undefined);
    x.el.querySelector("button").click();
    expect(tmp).toBe(0);

    tmp = 0;
    event = function(e) {
      tmp = 1;
    };
    x.on("dom:click button", event);
    expect(x.__widgetDomEvents["dom:click button"]).not.toBe(undefined);
    x.el.querySelector("p").click();
    expect(tmp).toBe(0);

    x.destroy();
  });

});

describe("ready", function() {
  test("base", function() {
    return new Promise(function(res) {
      widgetjs.ready(res);
    })
  });
});

describe("inheritance", function() {
  test("base", function() {
    var Claz = legado(widgetjs.Widget, {
      get tagName() { return "span"; },
      get className() { return "mytestspan"; },
      get attributes() {
        return {
          "id": "testspan"
        };
      },
      constructor() {
        widgetjs.Widget.prototype.constructor.apply(this);
        this.el.innerHTML = "test";
      },
    });
    var x = new Claz();
    x.appendTo(document.querySelector("body"));
    var $el = $("#testspan");
    expect($el.length).toBe(1);
  });
});
