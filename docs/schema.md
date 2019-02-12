---
description: At the core of redux-db is the schema
---

# Schema

To allow redux-db to know how to tie your records together and how to normalize given data, we must define a schema. The schema is defined using a simple nested JSON object. Each root property in the schema defines a table object. Each table then again defines the key fields.

```javascript
{
    "TableName": {
        "fieldName": { ...props }
        "otherField": { ...props }
    },
    "OtherTable": ...
}
```

### Primary Keys

If a table represents unique entities you should define a primary key. Primary keys are needed to query and to connect tables.

{% code-tabs %}
{% code-tabs-item title="Schema" %}
```javascript
{
    "MyTable" : {
        "id": { pk: true }
    }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="Data" %}
```javascript
[
    {
        id: 1234,
        otherProp: 'value'
    },
    {
        id: 1235,
        otherProp: 'value'
    }
]
```
{% endcode-tabs-item %}

{% code-tabs-item title="Model" %}
```javascript
const entity = MyTable.get( 1234 )
entity.value.otherProp === 'value'
```
{% endcode-tabs-item %}
{% endcode-tabs %}

#### Composite Keys

You may define multiple fields as primary keys. Doing so will combine the key values to a unique id. Use the "order" prop to ensure consistent key creation.

{% code-tabs %}
{% code-tabs-item title="Schema" %}
```javascript
{
    "MyTable" : {
        "id1": { pk: true, order: 0 }
        "id2": { pk: true, order: 1 }
    }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="Data" %}
```javascript
[
    {
        id1: 1234,
        id2: 'u1',
        name: 'entity 1'
    },
    {
        id1: 1235,
        id2: 'u2',
        name: 'entity 2'
    }
]
```
{% endcode-tabs-item %}

{% code-tabs-item title="Model" %}
```javascript
entity = MyTable.get( '1234_u1' )
id = MyTable.schema.composePrimaryKey([1234,'ul'])
entity = MyTable.get(id)
entity.value.name === 'entity 1'
```
{% endcode-tabs-item %}
{% endcode-tabs %}

The ids are joined as default with the '\_' underscore character, but can be customised providing the 'keySeparator' option during database creation.  

### Foreign Keys

You connect your tables using foreign keys. Foreign keys are noted using the "references"  and  "relationName" properties.

{% code-tabs %}
{% code-tabs-item title="Schema" %}
```javascript
{
    "Post" : {
        "id": { pk: true },
        "author": { references: "User", relationName: "posts" }
    },
    "User": {
        "id": { pk: true }
    }
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="Data" %}
```javascript
{
    posts: [
        { id: 0, author: 1234, title: 'post1' },
        { id: 1, author: 1234, title: 'post2' }
    ],
    users: [
        { id: 1234, name: 'tim' }
    ]
}
```
{% endcode-tabs-item %}

{% code-tabs-item title="Model" %}
```javascript
const user = UserTable.get(1234);
/// User instance has the "posts" property,
/// defined from the "relationName" in schema.

/// The user.posts property is an array of 
/// related posts connected through the foreign key.
const [firstPost] = user.posts;

/// The post instances have the "author" property,
/// defined from the fieldName of the post.author foreign key.
/// The author property is an user instance.
firstPost.author.id === user.id;
```
{% endcode-tabs-item %}
{% endcode-tabs %}

In the example above we are connecting the "Post" table and "User" table through the "Post.author" and "User.id" fields.

