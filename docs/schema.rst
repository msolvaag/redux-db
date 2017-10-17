==========
The schema
==========

To make redux-db know how to tie your records together and how to normalize given data, you must define a schema.
The schema is defined using a simple nested JSON object. Each property in the schema object defines a table name.
Each table name must again define a new object for it's fields.

:: 

    {
        "TableName": {
            "FieldName": { ... fieldProperties }
        }
    }

The table name is up to you, but the field names **must match** your data model.

.. note::
    It is not really required, but the table name should be written using pascal casing. This helps you seperate Table class instances later on.


Primary keys
------------

If a table represents a single entity you should define a primary key.

.. code-block:: javascript

    {
        "Table" : {
            "id": { type: "PK" }
        }
    }

You may define multiple fields as primary keys. Doing so will combine the key values to a unique id. This is useful for "join" tables.


Foreign keys
------------

You connect your tables using foreign keys. Foreign keys are noted using the "references" property.

.. code-block:: javascript

    {
        "Table1" : {
            "ref": { references: "Table2", relationName: "refs" }
        },
        "Table2": {
            id: { type: "PK" }
        }
    }

The "relationName" property is required if you wish to access the relationship on the Records of "Table2". It is also used during normalization.
An update/insert operation with the following data; will use the "relationName" to automatically normalize nested "refs".

.. code-block:: javascript

    [
        { id: 1, refs: [
            { id: 10, someField: "with value" },
            { id: 11, someField: "with another value" }
        ]}
    ]

The "refs" will automatically "flow" to "Table2". Upserting the related table.
    
Many to many relationships
--------------------------
To define a many to many relationship you can apply "join" tables. Tables that have multiple foreign keys to other tables.

.. code-block:: javascript

    {
        "Table1" : {
            id: { type: "PK" }
        },
        "Table2": {
            id: { type: "PK" }
        }
        "JoinTable": {
            "table1Id": { references: "Table1", relationName: "table2Refs" },
            "table2Id": { references: "Table2", relationName: "table1Refs" }
        }
    }

One to one relationships
------------------------

To specify a one to one relationship, you can set the "unique" flag on the field definition.
This will enforce the unique constraint for updates and inserts.

.. code-block:: javascript

    {
        "Parent":{
            "id": { type: "PK" }
        },
        "Child": {
            "id": { type: "PK" },
            "parentId": { references: "Parent", relationName: "child", unique: true }
        }
    }

Self referencing tables
-----------------------

It's perfectly fine to add a self referencing table field

.. code-block:: javascript

    {
        "Table": {
            "id": { type: "PK" },
            "parentId": { references: "Table", relationName: "children" }
        }
    }


Cascading deletes
-----------------

You may define the "cascade" flag on a field definition. This will automatically delete the referencing records when the foreign table record is deleted.

.. code-block:: javascript

    {
        "Parent":{
            "id": { type: "PK" }
        },
        "Child": {
            "id": { type: "PK" },

            // when the related record of "Parent" is deleted, all it's children is also deleted.
            "parentId": { references: "Parent", relationName: "children", cascade: true }
        }
    }

Other field types
-----------------

Aside for the "PK" type, you may also define fields of type "ATTR" and "MODIFIED".

The "ATTR" type is the default if not defined. This type promotes a field from the data model to the record model.

.. code-block:: javascript
    
    {
        "Table": {
            "id": { type: "PK" },
            "someValue": { type: "ATTR" }
        }
    }

This will declare a "someValue" property on the RecordModel instance.


The "MODIFIED" type defines a field that will be used to compare the state record with a updated record.
The default comparison is to do a object shallow equallity check.

.. code-block:: javascript

    {
        "Table": {
            "id": { type: "PK" },
            "modifiedDate": { type: "MODIFIED" } // Uses the "modifiedDate" value to compare objects.
        }
    }

.. tip::
    Using the "MODIFIED" type could improve the performance for large updates.


Custom value factory
--------------------
If you wish to transform the value of a given field, you may define a callback on the field definition.

.. code-block:: javascript

    {
        "Table": {
            "id": { type: "PK" },
            "fullName": { value: (r)=> r.firstName + " " + r.lastName },
            "modified": { type: "MODIFIED", value: r=> r.stamp1 + r.stamp2 } // Uses a computed value to compare objects.
        }    
    }


Custom normalization
--------------------
During data normalization you may have the need to transform the data.
redux-db provides a basic normalization hook for each table.

.. code-block:: javascript

    ReduxDB.createDatabase( schema, {
        onNormalize: {
            "Table1": ( item, context ) => {
                const { id, name, ...rest } = item;

                // We split the given data and emits to "Table2" for normalization.
                context.emit( "Table2", rest );

                // returns the data for "Table1"
                return { id, name };
            }
        }
    });

Schema reference
----------------
All supported definitions

.. code-block:: javascript

    {
        "Table" : {
            "Field": {
                type: "PK" | "MODIFIED" | "ATTR",

                // Defines a custom property name for the field. Defaults to the field name.
                propName?: string;

                // Defines the foreign table this field references.
                references?: string;

                // Defines the relationship name, which'll be the property name on the foreign table.
                relationName?: string;

                // If set, causes the record to be deleted if the foreign table row is deleted.
                cascade?: boolean;

                // If set, declares that this relation is a one 2 one relationship.
                unique?: boolean;

                // Defines a custom value factory for each record.
                value?: (record: any, context?: ComputeContext) => any;
            }
        }
    }