
Tutorial
========

Presentation of Spear.js
------------------------

Spear.js is a lightweight framework in JavaScript to separate web applications in multiples manageable components called
widgets_.

.. _widgets: https://en.wikipedia.org/wiki/Widget_(GUI)

Spear.js is not a full featured framework that can handle all aspects of a web application like network communications
or routing. There are good libraries for that. Spear.js only handles one aspect of web development: separation of
visual components into separate entities, and it tries to do it as best as it cans.

Quickstart
----------

The easiest way to start a Spear.js application is to checkout the sample application. Using git_, do this:

.. _git: https://git-scm.com/

.. code-block:: bash

    git clone https://github.com/nicolas-van/spear.js-starter.git
    
This sample application uses bower_, npm_ and grunt_ to download the dependencies and launch a small web server. Type
these lines to download everything and start the server:

.. _bower: http://bower.io/
.. _npm: https://www.npmjs.com/
.. _grunt: http://gruntjs.com/

.. code-block:: bash

    bower install
    npm install
    grunt
    
Then head your web browser to ``http://localhost:9000`` and you will see the *Hello World* message outputed by
the application.

A Word About Template Engines
-----------------------------

Spear.js is a lightweight framework. As such, it doesn't impose a particular template engine to render HTML. The
sample application uses Nunjucks_ from Mozilla as it is a high quality and full featured template engine in JavaScript,
but you are free to replace it by any other template engine.

.. _Nunjucks: https://mozilla.github.io/nunjucks/
