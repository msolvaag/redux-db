============
Applying reducers
============

When you have your schema set up it's time to write your reducers. 
redux-db provides a simple function to combine multiple reducers to work on the normalized state.

::

    /// reducer.js

    import ReduxDB from "redux-db";
    import db from "./schema";
    
    export const dbReducer = db.combineReducers(
        ( session, action ) => {
            const { BlogPost, Comment, User } = session;

            switch( action.type ){
                case "POSTS_FETCH_DONE":
                case "POST_FETCH_DONE":
                case "POST_UPDATE":
                case "POST_INSERT":
                    // all these actions may be handled using just one statement.
                    // the upsert method accepts both single objects and arrays.

                    BlogPost.upsert( action.payload );
                    break;

                case "POST_DELETE":
                    const {id} = action.payload;
                    const post = BlogPost.get( id ); 
                    
                    post.comments.delete();
                    post.delete();
                    break;        

                case "COMMENT_UPDATE":
                case "COMMENT_INSERT":
                    // assuming payload contains {id,post,author}
                    const {post} = action.payload;

                    BlogPost.get(post).comments.add(action.payload);
                    // or just, Comment.upsert(action.payload);
                    break;
                
                case "COMMENT_DELETE":
                    const {id} = action.payload;
                    Comment.delete(id);
                    break;
            }
        }
    );
