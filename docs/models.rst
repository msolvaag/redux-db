============
The object model
============

To access and manipulate your normalized state redux-db provides you with a simple "Object-relational mapping" (ORM).

redux-db uses the concept of a session where each "table" is wrapped in a TableModel.
The TableModel helps to query and perform CRUD operations easily.

To begin a new session and perform some action:

.. literalinclude:: /example/session.js
    :language: js

The TableModel object exposes the following methods and properties:

TBA: full api