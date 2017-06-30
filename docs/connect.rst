============
Connect your components
============

As the state tree is now normalized you are likely to denormalize your data for your views.
Example with react::

    import {Component} from "react";
    import {connect} from "react-redux";
    import {db} from "./schema";

    class PostListComponent extends Component{
        render(){
            return <table>
                <tbody>
                    {this.props.posts.map( post => (
                    <tr>
                        <td>{post.title}</td>
                        <td>{post.author}</td>
                        <td>{post.numComments}</td>
                    </tr>
                    )}
                <tbody>
            </table>;
        }
    }

    const mapStateToProps = ( state, ownProps ) => {
        const {BlogPost} = db.createSession(state.db);

        return {
            posts: BlogPost.all().map( post => ({
                ...post.value,
                numComments: post.comments.length,
                author: post.author.name 
            }));
        };
    };

    export const PostList = connect( mapStateToProps )(PostListComponent);

NB! This is all well and good, but as your state tree and application grows you should definitely switch to using memoized selectors (eg. reselect_ ).

.. _reselect: https://github.com/reactjs/reselect