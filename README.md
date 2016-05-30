
widget.js
=========

A lightweight JavaScript component framework
--------------------------------------------

widget.js is a lightweight framework in JavaScript to separate web applications in multiples reusable components called
widgets.

    class MyWidget extends widget.Widget {
        constructor() {
            super();
            this.on("dom:click h1", function() {
                window.location = "http://widgetjs.neoname.eu";
            });
        }
        render() {
            return "<h1>Welcome to widget.js!</h1>";
        }
    }

    new MyWidget().appendTo(document.body);
    
* Uses inheritance based on ES6 or helpers if you don't want to use ES6 classes.
* Provides an events system separate from the DOM.
* Provides life-cycle management for visual components.
* Can be used with or without jQuery.

[Read the documentation here](http://widgetjs.readthedocs.org/)

widget.js is not a full featured framework that can handle all aspects of a web application like network communications
or routing, there already exists good libraries for that. widget.js only handles one aspect of web development:
separation of visual components into independant entities. So it provides only features to serve that goal, namely
widgets, events and lifecycle management.

To install:

    bower install widget

License: MIT

Supported browsers: All major browsers as well as IE down to IE9.
