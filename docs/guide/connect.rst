=======================
Connect your components
=======================

As the state tree is now normalized you are likely to denormalize your data for your views.
Example given in react:

.. literalinclude:: ../example/postListComponent.jsx

.. warning::

    This is all well and good, but as your state tree and application grows you should definitely switch to using memoized selectors (eg. reselect_ ).

.. _reselect: https://github.com/reactjs/reselect