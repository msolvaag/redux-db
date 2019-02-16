# Introduction

ReduxDB is a state management tool for redux. It normalizes and helps querying your state using a simple Object Relational Model \(ORM\).

If your app deals with nested data payloads it may be hard to ensure that your redux state is updated correctly. Such updates may involve updating several parts of the state, spread across reducers and is error prone.  Also it quickly leads to unnecessary and unrelated updates of your components.

Normalizing state is one common way to handle nested data issues. Splitting each entity into its own table and keeping track of relationships. Read more about [normalizing state shape](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape) in the redux docs.

### Using ReduxDB to normalize your redux state

ReduxDB uses a JSON schema definition to normalize your state.   
Given the following data:

{% code-tabs %}
{% code-tabs-item title="from redux.js.org" %}
```javascript
const blogPosts = [
  {
    id: 'post1',
    author: { username: 'user1', name: 'User 1' },
    body: '......',
    comments: [
      { id: 'comment1', author: { username: 'user2', name: 'User 2' }, comment: '.....' },
      { id: 'comment2', author: { username: 'user3', name: 'User 3' }, comment: '.....' }
    ]
  },
  {
    id: 'post2',
    author: { username: 'user2', name: 'User 2' },
    body: '......',
    comments: [
      { id: 'comment3', author: { username: 'user3', name: 'User 3' }, comment: '.....' },
      { id: 'comment4', author: { username: 'user1', name: 'User 1' }, comment: '.....' },
      { id: 'comment5', author: { username: 'user3', name: 'User 3' }, comment: '.....' }
    ]
  }
  // and repeat many times
]
```
{% endcode-tabs-item %}
{% endcode-tabs %}

And the ReduxDB schema:

```javascript
{
    'Post': {
        id: { pk: true },
        author: { references: 'User', relationName: 'posts' }
    },
    'User': {
        username: { pk: true }
    },
    'Comment': {
        id: { pk: true },
        post: { references: 'Post', relationName: 'comments' },
        author: { references: 'User', relationName: 'comments' }
    }
}
```

Will produce the following normalized state:

```javascript
{
    'Post': {
        byId: {
            'post1': { id: 'post1', body: '......', author: 'user1' },
            'post2': { id: 'post2', body: '......', author: 'user2' }
        },
        ids: [ 'post1', 'post2' ]
    },
    'User': {
        byId: {
            'user1': { username: 'user1', name: 'User 1' },
            'user2': { username: 'user2', name: 'User 2' },
            'user3': { username: 'user3', name: 'User 3' }
        },
        ids: [ 'user1', 'user2', 'user3' ]        
    },
    'Comment':{
        byId: {
            'comment1': { id: 'comment1', author: 'user2', post: 'post1', comment: '.....' },
            'comment2': { id: 'comment2', author: 'user3', post: 'post1', comment: '.....' },
            'comment3': { id: 'comment3', author: 'user3', post: 'post2', comment: '.....' },
            'comment4': { id: 'comment4', author: 'user1', post: 'post2', comment: '.....' },
            'comment5': { id: 'comment5', author: 'user3', post: 'post2', comment: '.....' }
        },
        ids: [ 'comment1', 'comment2', 'comment3', 'comment4', 'comment5' ]
    }
}
```

