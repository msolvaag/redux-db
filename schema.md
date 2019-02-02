# Schema

To make redux-db know how to tie your records together and how to normalize given data, you must define a schema. The schema is defined using a simple nested JSON object. Each property in the schema object defines a table name. Each table name must again define a new object for it's fields.

```javascript
{
    "TableName": {
        "FieldName": { ...fieldProperties }
    }
}
```

