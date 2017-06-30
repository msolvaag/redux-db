============
The object model
============

To access and manipulate your normalized state redux-db provides you with a simple "Object-relational mapping" (ORM).

redux-db uses the concept of a session where each "table" is wrapped in a TableModel.
The TableModel helps to query and perform CRUD operations easily.

To begin a new session and perform some action:

.. code-block:: js

    import {db} from "./schema";

    const session = db.createSession( state /* not defined here */ );

    // your TableModels are properties in the session "tables" object.
    const { BlogPost, Comment, User } = session.tables;

    // the "get" method retrives a RecordModel by it's primary key.
    // the "update" method allows for partial updates of record data.
    BlogPost.get("post1").update( { body: "new text" } );

    // commit the session
    const newState = session.commit();

