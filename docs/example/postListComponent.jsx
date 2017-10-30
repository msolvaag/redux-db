import { Component } from "react";
import { connect } from "react-redux";
import { db } from "./schema";

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
    const { BlogPost } = db.selectTables(state.db);

    return {
        posts: BlogPost.all().map(post => ({
            ...post.value,
            numComments: post.comments.length,
            author: post.author.value.name
        }))
    };
};

export const PostList = connect(mapStateToProps)(PostListComponent);
