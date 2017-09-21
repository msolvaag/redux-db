# redux-db
redux-db provides a normalized [redux](http://redux.js.org) store and easy object management.

## Documentation
Head over to [http://redux-db.readthedocs.io](http://redux-db.readthedocs.io/en/latest/).

## Why
Having a normalized state is a good strategy if your data is nested in different ways. The redux documentation has a nice explanation [here](http://redux.js.org/docs/recipes/reducers/NormalizingStateShape.html).

## Contact / feedback
Feel free to create issues and PR's. You may also comment/ask questions on the gitter channel: [https://gitter.im/redux-db](https://gitter.im/redux-db).

## Dependencies
* none

## Performance & size
redux-db uses internal indexes to speed up lookups and is quite fast at the current state. However, optimizing performance and build size is a high priority forward. Current size is small, only ~4K minified and gzipped.

## Credits
This project is greatly inspired by libraries such as [normalizr](https://www.npmjs.com/package/normalizr) and [redux-orm](https://www.npmjs.com/package/redux-orm). redux-db is however a complete rewrite and only lends it's basic consepts.
