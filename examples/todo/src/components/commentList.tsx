import * as React from "react";

import { deleteComment } from "../actions";
import { CommentViewModel } from "../selectors";

export interface CommentListProps {
    comments: CommentViewModel[];
    deleteComment: typeof deleteComment;
}

export class CommentList extends React.Component<CommentListProps> {

    deleteComment(e: React.MouseEvent<Element>, comment: CommentViewModel) {
        e.preventDefault();
        this.props.deleteComment(comment.id);
    }

    render() {
        return <div className="card mb-4">
            <table className="table">
                <tbody>
                    {this.props.comments.map(c => (
                        <tr key={c.id}>
                            <td>{c.authorName}</td>
                            <td>{c.value}</td>
                            <td className="text-right">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={e => this.deleteComment(e, c)}
                                >
                                    <i className="fa fa-trash-o"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>;
    }
}
