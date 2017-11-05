# redux-db
[![NPM downloads](https://img.shields.io/npm/dm/redux-db.svg?style=flat-square)](https://www.npmjs.com/package/redux-db)
[![NPM package](https://img.shields.io/npm/v/redux-db.svg?style=flat-square)](https://www.npmjs.com/package/redux-db)

redux-db provides a normalized [redux](http://redux.js.org) store and easy object management.

## Why
Having a normalized state is a good strategy if your data is nested in different ways. The redux documentation has a nice explanation [here](http://redux.js.org/docs/recipes/reducers/NormalizingStateShape.html).

## How
``` javascript
import db from "./schema";

export const dbReducer = db.combineReducers(
    (session, action) => {
        const { BlogPost, Comment, User } = session;

        switch (action.type) {
            case "POSTS_FETCH_DONE":
            case "POST_FETCH_DONE":
            case "POST_UPDATE":
            case "POST_INSERT":
                // all these actions may be handled using just one statement.
                // the upsert method accepts both single objects and arrays.
                // the payload is automatically normalized and related tables are also updated.

                BlogPost.upsert(action.payload);
                break;

            case "POST_DELETE": {
                const { id } = action.payload;
                const post = BlogPost.get(id);

                post.comments.delete(); // Could be skipped if cascading deletes are defined.
                post.delete();

                // or just, BlogPost.delete( id );
                break;
            }
            case "COMMENT_UPDATE":
            case "COMMENT_INSERT": {
                // assuming payload contains {id,post,author}
                const { post } = action.payload;

                BlogPost.get(post).comments.add(action.payload);
                // or just, Comment.upsert(action.payload);
                break;
            }
            case "COMMENT_DELETE": {
                const { id } = action.payload;
                Comment.delete(id);
                break;
            }
        }
    }
);
```

## Documentation
Head over to [http://redux-db.readthedocs.io](http://redux-db.readthedocs.io/en/latest/).

## Examples
You will find an extensive example using redux-db to create a basic "todo" app in the /examples folder.

## Contact / feedback
Feel free to create issues and PR's.

## Dependencies
* none

## Performance & size
redux-db uses internal indexes to speed up lookups and is quite fast at the current state. However, optimizing performance and build size is a high priority forward. Current size is small, only ~5K minified and gzipped.

## Credits
This project is inspired by libraries such as [normalizr](https://www.npmjs.com/package/normalizr) and [redux-orm](https://www.npmjs.com/package/redux-orm). redux-db is however a complete rewrite and only lends it's basic consepts.

## Changelog

#### v0.9.0
* Bugfixes and improvements

#### v0.8.0
* Added support for providing a custom model factory.
* BREAKING CHANGE: some exported interfaces are renamed
    - Record => TableRecord
    - RecordSet => TableRecordSet

#### v0.7.0
* Added support for PK fields to also reference foreign tables. 
* Improved error handling for some cases.
* BREAKING CHANGE: the field type "FK" is removed. Instead it is implied from the usage of the "references" definition.
* Docs is updated to latest changes and features.

#### v0.6.0
* Added support for one 2 one relationships
* Added support for cascading deletes
* Improved typings
* Minor optimizations