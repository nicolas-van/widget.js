
widgetjs
========

A lightweight JavaScript component framework
--------------------------------------------

widgetjs is a lightweight framework in JavaScript to separate web applications in multiples reusable components called
widgets.

    import {Widget} from "widgetjs";

    class MyWidget extends Widget {
        constructor() {
            super();
            this.el.innerHTML = "<h1>Welcome to widgetjs!</h1>";
            this.on("dom:click h1", function() {
                window.location = "http://widgetjs.neoname.eu";
            });
        }
    }

    new MyWidget().appendTo(document.body);

* Uses inheritance based on ES6 or helpers if you don't want to use ES6 classes.
* Provides an events system separate from the DOM.
* Provides life-cycle management for visual components.
* Can be used with or without jQuery.

[Read the documentation here](http://widgetjs.readthedocs.org/)

widgetjs is not a full featured framework that can handle all aspects of a web application like network communications
or routing, there already exists good libraries for that. widgetjs only handles one aspect of web development:
separation of visual components into independant entities. So it provides only features to serve that goal, namely
widgets, events and lifecycle management.

To install:

    npm install widgetjs

License: MIT

Supported browsers: All major browsers as well as IE down to IE9.
