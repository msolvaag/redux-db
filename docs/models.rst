================
The object model
================

To access and manipulate your normalized state redux-db provides you with a simple "Object-relational mapping" (ORM).

Session
-------

redux-db uses the concept of a session where each "table" is wrapped in a Table_ class.
The Table_ class helps to query and perform CRUD operations easily.

To begin a new session and perform some action:

.. literalinclude:: ../example/session.js
    :language: js

Table
-----

The Table class provides several methods and properties for accessing the table records.
Each method will return table rows wrapped in a Record_ class.

Methods and propertes:

.. code-block:: js

    /// gets the number of records in the table.
    length : number;

    /// gets all raw record values
    /// equivalent to all().map( r => r.value )
    values: any[];

    /// returns all records in table.
    all() : Record[];

    /// returns all records matching a given filter.
    filter( predicate: ( record: Record ) => boolean ) : Record[];

    /// returns a single record by id.
    get( id:string|number ) : Record;

    /// returns a single record by id. null if not found.
    getOrDefault(id: number | string) : Record | null;

    /// checks whether a record exists.
    exists(id: number | string) : bool;

    /// inserts one or more records. 
    /// returns the first inserted record.
    insert( data: any ) : Record;

    /// updates one or more records. 
    /// returns the first updated record.
    update( data: any ) : Record;

    /// upserts one or more records. 
    /// returns the first upserted record.
    upsert( data: any ) : Record;

    /// deletes a single record by it's primary key.
    delete( id: string ) : void;

    /// get a single the record value
    value( id:number | string ) : any | undefined;

.. note::

    The update/insert/upsert operations accepts nested data and will be normalized according to your schema definition.
    The normalized relations will also be updated/inserted to its respective tables. 

Record
------

The Record class wraps an table row and provides methods and propertes for the given row/entity. 

Methods and propertes:

.. code-block:: js

    /// gets the record primary key value
    id: string;

    /// gets the raw record value
    value : any;

    /// updates the record with new data.
    update( data: any ) : this;

    /// deletes the record
    delete() : void;


In addition to the methods and propertes defined above, the Record class will also contain properties for accessing foreign relations.
Given the following schema:: 

    {
        "Table1" : {
            id: { type: "PK" }
        },
        "Table2" : {
            id: { type: "PK" },
            ref: { references: "Table1", relationName: "rels" }
        }
    };

The Record class for "Table1" will contain a property "rels" of type RecordSet_. The RecordSet_ wraps all records in "Table2" relating to "Table1" by its PK.
The Record class for "Table2" will contain a property named "ref" which holds a Record of "Table1".

.. code-block:: js

    Table1.insert( {
        id: 1,
        body: "some text"
    });
    Table2.insert( [
        { id: 1, ref: 1 },
        { id: 2, ref: 1 },
        { id: 3, ref: 2 }
    ]);

    const table1Record = Table1.get( 1 );

    // table1Record will have the property "rels"
    table1Record.rels;

    // the rels property is a RecordSet of Records from "Table2"
    /* table1Record.rels.value => [
        { id: 1, ref: 1 },
        { id: 2, ref: 1 }
    ]; */

    // Table2 records has the "ref" property. 
    Table2.get(1).ref.value.body === "some text";

RecordSet
---------

The RecordSet class wraps a relation between two tables. 

Methods and propertes:

.. code-block:: js

    /// gets the primary keys of the records in the set.
    ids : string[];

    /// gets the raw array of record values.
    value : any[];

    /// gets the number of records in the set.
    length : number;

    /// returns all records in the set.
    all() : Record[];

    /// updates the records with new data.
    update( data: any ) : this;

    /// deletes all records in the set.
    delete() : void;

