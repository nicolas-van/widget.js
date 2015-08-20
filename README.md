
widget.js
=========

The lightweight JavaScript component framework
----------------------------------------------

widget.js is a lightweight framework in JavaScript to separate web applications in multiples reusable components called
widgets.

    var MyWidget = widget.Widget.$extend({
        render: function() {
            return "<h1>Welcome to widget.js!</h1>";
        },
        domEvents: {
            "click h1": function() {
                window.location = "http://widgetjs.neoname.eu";
            },
        },
    });

    new MyWidget().appendTo($("body"));

[Read the documentation here](http://widgetjs.readthedocs.org/)

widget.js is not a full featured framework that can handle all aspects of a web application like network communications
or routing, there already exists good libraries for that. widget.js only handles one aspect of web development:
separation of visual components into independant entities. So it provides only features to serve that goal, namely
widgets, lifecycle management and events.

To install with its dependencies:

    bower install widget

License: MIT

Supported browsers: IE up to IE7, all other major browsers up to N-1 version.
