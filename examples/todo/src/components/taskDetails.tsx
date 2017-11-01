import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import { deleteTask, updateTask, addComment, deleteComment } from "../actions";
import { selectTask, selectUsers, TaskViewModel, CommentViewModel, UserViewModel } from "../selectors";

export interface TaskProps extends RouteComponentProps<{ taskId: string }> {
    task: TaskViewModel;
    users: UserViewModel[];

    deleteTask: typeof deleteTask;
    updateTask: typeof updateTask;
    addComment: typeof addComment;
    deleteComment: typeof deleteComment;
}

class TaskComponent extends React.Component<TaskProps> {
    private _userSelect: HTMLSelectElement | null;
    private _valueInput: HTMLInputElement | null;

    addComment(e: React.MouseEvent<Element>) {
        e.preventDefault();
        if (this._userSelect && this._valueInput)
            this.props.addComment({
                taskId: this.props.task.id,
                value: this._valueInput.value,
                author: parseInt(this._userSelect.value)
            })
    }

    deleteComment(e: React.MouseEvent<Element>, comment: CommentViewModel) {
        e.preventDefault();
        this.props.deleteComment(comment.id);
    }

    render() {
        return <div>
            <h2>{this.props.task.title}</h2>
            <hr />

            <div className="card mb-4">
                <table className="table">
                    <tbody>
                        {this.props.task.comments.map(c => (
                            <tr key={c.id}>
                                <td>{c.authorName}</td>
                                <td>{c.value}</td>
                                <td>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={e => this.deleteComment(e, c)}>
                                        <i className="fa fa-trash-o"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="form-group">
                        <label>Comment text</label>
                        <input type="text" ref={e => this._valueInput = e} className="form-control" />
                    </div>
                    <div className="form-group">
                        <label>By</label>
                        <select ref={e => this._userSelect = e} className="form-control">
                            {this.props.users.map(u => <option value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="card-footer">
                    <button type="button" className="btn btn-primary" onClick={e => this.addComment(e)}>Comment</button>
                </div>
            </div>

        </div >;
    }
}

export const TaskDetails = connect(
    (state: any, ownProps: TaskProps) => {
        return { task: selectTask(state, ownProps.match.params.taskId), users: selectUsers(state) };
    },
    ({ deleteTask, updateTask, deleteComment, addComment })
)(TaskComponent) as React.ComponentClass; // fix for typing errors