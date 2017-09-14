import { Component } from "react";
import { connect } from "react-redux";
import { db } from "./schema";
import { selectAllPosts } from "./selectors";

class PostListComponent extends Component {
    render() {
        return <table>
            <tbody>
                {this.props.posts.map(post => (
                    <tr>
                        <td>{post.title}</td>
                        <td>{post.author}</td>
                        <td>{post.numComments}</td>
                    </tr>
                ) }
            </tbody>
        </table>;
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        posts: selectAllPosts( state )
    };
};

export const PostList = connect(mapStateToProps)(PostListComponent);
