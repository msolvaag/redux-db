================
The object model
================

To access and manipulate your normalized state redux-db provides you with a simple "Object-relational mapping" (ORM).

Database
--------
Your schema definition must be provided to a Database class instance:

.. code-block:: js

    import { createDatabase } from "redux-db";
    
    const schema = {
        ...
    };

    export const db = createDatabase( schema, /*options*/ );

Session
-------

redux-db uses the concept of a session where each "table" is wrapped in a TableModel_ class.
The TableModel_ class helps to query and perform CRUD operations easily.

To begin a new session and perform some action:

.. literalinclude:: ../example/session.js
    :language: js

TableModel
----------

The Table class provides several methods and properties for accessing the table records.
Each method will return table rows wrapped in a RecordModel_ class.

Methods and propertes:

.. code-block:: js

    /// gets the number of records in the table.
    length : number;

    /// gets all raw record values
    /// equivalent to all().map( r => r.value )
    values: any[];

    /// returns all records in table.
    all() : RecordModel[];

    /// returns all records matching a given filter.
    filter( predicate: ( record: RecordModel ) => boolean ) : RecordModel[];

    /// returns a single record by id.
    get( id:string|number ) : RecordModel;

    /// returns a single record by id. null if not found.
    getOrDefault(id: number | string) : RecordModel | null;

    /// checks whether a record exists.
    exists(id: number | string) : bool;

    /// inserts one or more records. 
    /// returns the first inserted record.
    insert( data: any ) : RecordModel;

    /// inserts one or more records. 
    /// returns the inserted records.
    insertMany( data: any ) : RecordModel[];

    /// updates one or more records. 
    /// returns the first updated record.
    update( data: any ) : RecordModel;

    /// updates one or more records. 
    /// returns the updated records.
    updateMany( data: any ) : RecordModel[];

    /// upserts one or more records. 
    /// returns the first upserted record.
    upsert( data: any ) : RecordModel;

    /// deletes a single record by it's primary key.
    delete( id: string ) : boolean;

    /// deletes all records in table.
    deleteAll() : void;

    /// get a single the record value
    value( id:number | string ) : any | undefined;

.. note::

    The update/insert/upsert operations accepts nested data and will be normalized according to your schema definition.
    The normalized relations will also be updated/inserted to its respective tables. 

RecordModel
-----------

The RecordModel class wraps an table row and provides methods and propertes for the given row/entity. 

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


In addition to the methods and propertes defined above, the RecordModel class will also contain properties for accessing foreign relations.
Given the following schema:

.. code-block:: js

    {
        "Table1" : {
            "id": { type: "PK" }
        },
        "Table2" : {
            "id": { type: "PK" },
            "ref": { references: "Table1", relationName: "rels" }
        }
    };

The Record class for "Table1" will contain a property "rels" of type RecordSetModel_. The RecordSetModel_ wraps all records in "Table2" relating to "Table1" by its PK.
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

    ---

    // Since we have defined the relationName "rels" on the "Table2.ref" field, the following insert is equivalent to the first two.
    Table1.insert({
        id: 1,
        body: "some text",
        rels: [
            { id: 1, ref: 1 },
            { id: 2, ref: 1 },
            { id: 3, ref: 2 }        
        ]
    });

RecordSetModel
--------------

The RecordSetModel class wraps a relation between two tables. 

Methods and propertes:

.. code-block:: js

    /// gets the primary keys of the records in the set.
    ids : string[];

    /// gets the raw array of record values.
    value : any[];

    /// gets the number of records in the set.
    length : number;

    /// returns all records in the set.
    all() : RecordModel[];

    /// updates the records with new data.
    update( data: any ) : this;

    /// deletes all records in the set.
    delete() : void;
