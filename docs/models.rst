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

get( id:string ) : RecordModel
~~~~~~~~~~~~~~~~~
Gets a single RecordModel from the table by it's primary key.
If none is found "null" is returned.

update( data ) : RecordModel
~~~~~~~~~~~~~~~~~
Updates one or more records (given they contain a valid PK). 
Returns the first updated RecordModel;

insert( data ) : RecordModel
~~~~~~~~~~~~~~~~~
Inserts one or more records (given they contain a valid PK). 
Returns the first updated RecordModel;

upsert( data ) : RecordModel
~~~~~~~~~~~~~~~~~
Updates or inserts one or more records (given they contain a valid PK). 
Returns the first updated RecordModel; 

all() : RecordModel[]
~~~~~~~~~~~~~~~~~
Returns all records in the table.

filter( predicate: ( record: RecordModel ) => boolean ) : RecordModel[]
~~~~~~~~~~~~~~~~~
Filters all records in the table by a predicate.

TBA: full api