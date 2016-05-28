"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function () {
    "use strict";

    /*if (typeof(module) !== "undefined") {
        global.assert = require("assert");
        var jsdom = require("jsdom").jsdom;
        var doc = jsdom();
        var window = doc.parentWindow;
        global.widget = require("./widget")(window);
    }*/

    suite("LifeCycle");

    test("base", function () {
        var x = new widget.LifeCycle();
        assert.equal(!!x.destroyed, false);
        x.destroy();
        assert.equal(x.destroyed, true);
    });

    test("parents", function () {
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

    test("base", function () {
        var x = new widget.EventDispatcher();
        var tmp = 0;
        var fct = function fct() {
            tmp = 1;
        };
        x.on("test", fct);
        assert.equal(tmp, 0);
        x.trigger("test");
        assert.equal(tmp, 1);
        tmp = 0;
        x.off("test", fct);
        x.trigger("test");
        assert.equal(tmp, 0);
        tmp = 0;
        x.on("test", fct);
    });

    suite("Widget");

    test("base", function () {
        var Claz = function (_widget$Widget) {
            _inherits(Claz, _widget$Widget);

            function Claz() {
                _classCallCheck(this, Claz);

                return _possibleConstructorReturn(this, Object.getPrototypeOf(Claz).apply(this, arguments));
            }

            _createClass(Claz, [{
                key: "tagName",
                value: function tagName() {
                    return "span";
                }
            }, {
                key: "className",
                value: function className() {
                    return "mytestspan";
                }
            }, {
                key: "attributes",
                value: function attributes() {
                    return {
                        "id": "testspan"
                    };
                }
            }, {
                key: "render",
                value: function render() {
                    return "test";
                }
            }]);

            return Claz;
        }(widget.Widget);
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

    test("appendEvents", function () {
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

    test("autoParent", function () {
        var Claz = function (_widget$Widget2) {
            _inherits(Claz, _widget$Widget2);

            function Claz() {
                _classCallCheck(this, Claz);

                return _possibleConstructorReturn(this, Object.getPrototypeOf(Claz).apply(this, arguments));
            }

            _createClass(Claz, [{
                key: "render",
                value: function render() {
                    return "<div></div>";
                }
            }]);

            return Claz;
        }(widget.Widget);

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

    test("domEventsSimple", function () {
        var x = new widget.Widget();
        var tmp = 0;
        x.on("dom:click", function (e) {
            assert.strictEqual(this, x);
            assert.strictEqual(e.target, x.el);
            tmp = 1;
        });
        x.el.click();
        assert.strictEqual(tmp, 1);
    });

    test("domEventsBubbling", function () {
        var Claz = function (_widget$Widget3) {
            _inherits(Claz, _widget$Widget3);

            function Claz() {
                _classCallCheck(this, Claz);

                return _possibleConstructorReturn(this, Object.getPrototypeOf(Claz).apply(this, arguments));
            }

            _createClass(Claz, [{
                key: "render",
                value: function render() {
                    return "<p><button></button></p>";
                }
            }]);

            return Claz;
        }(widget.Widget);

        var x = new Claz();
        x.appendTo($("body")[0]); // only for Safari which handles click events in an odd way
        var tmp = 0;
        var event = function event(e) {
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
        event = function event(e) {
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
        event = function event(e) {
            tmp = 1;
        };
        x.on("dom:click button", event);
        assert.notEqual(x.__widgetDomEvents["dom:click button"], undefined);
        x.el.querySelector("p").click();
        assert.strictEqual(tmp, 0);

        x.destroy();
    });
})();
//# sourceMappingURL=test.babelized.js.map
