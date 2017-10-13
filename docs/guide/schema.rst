====================
Defining your schema
====================

To make redux-db normalize your nested data, you must define a schema.
Given the following data:

.. literalinclude:: ../../example/data.js
    :language: js

You would define a schema like so:

.. literalinclude:: ../../example/schema.js
    :language: js

Note you may only define foreign and primary keys. The data fields like "User.name" and "Comment.comment" are not needed in the schema.

Using this schema definition, the example data would be normalized out in the following manner:

.. literalinclude:: ../../example/data-normalized.js
    :language: js
