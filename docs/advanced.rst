=================
Advanced features
=================

Custom model factory
--------------------

You may provide your own implementation of the model factory used by redux-db.  This allows you to extend the functionalliy each model provides.

Here is an example of a model factory extending the default models.

.. literalinclude:: ./example/modelFactory.js
    :language: javascript