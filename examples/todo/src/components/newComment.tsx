import * as React from "react";
import { connect } from "react-redux";

import { addComment } from "../actions";
import { selectUsers, UserViewModel } from "../selectors";

interface Props {
    taskId: number;
    users: UserViewModel[];

    addComment: typeof addComment;
}

class NewCommentComponent extends React.Component<Props> {
    private _userSelect: HTMLSelectElement | null = null;
    private _valueInput: HTMLTextAreaElement | null = null;

    addComment(e: React.MouseEvent<Element>) {
        e.preventDefault();
        if (this._userSelect && this._valueInput)
            this.props.addComment({
                taskId: this.props.taskId,
                value: this._valueInput.value,
                author: parseInt(this._userSelect.value, 10)
            });
    }

    render() {
        return <div className="card">
            <div className="card-header">New comment</div>
            <div className="card-body">
                <div className="form-group">
                    <label>Author</label>
                    <select ref={e => this._userSelect = e} className="form-control">
                        {this.props.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Body</label>
                    <textarea ref={e => this._valueInput = e} className="form-control" rows={3} />
                </div>
            </div>
            <div className="card-footer">
                <button type="button" className="btn btn-primary" onClick={e => this.addComment(e)}>Comment</button>
            </div>
        </div>;
    }
}

export const NewComment = connect(
    (state: any) => ({ users: selectUsers(state) }),
    ({ addComment })
)(NewCommentComponent);
