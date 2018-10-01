import * as React from "react";
import { connect } from "react-redux";

import { createTask } from "../actions";
import { selectUsers, UserViewModel } from "../selectors";

interface Props {
    users: UserViewModel[];

    createTask: typeof createTask;
}

class NewTaskComponent extends React.Component<Props> {
    private _userSelect: HTMLSelectElement | null = null;
    private _valueInput: HTMLInputElement | null = null;

    createTask(e: React.MouseEvent<Element>) {
        e.preventDefault();
        if (this._userSelect && this._valueInput)
            this.props.createTask({
                title: this._valueInput.value,
                owner: parseInt(this._userSelect.value, 10),
                status: "open"
            });
    }

    render() {
        return <div className="card">
            <div className="card-header">New task</div>
            <div className="card-body">
                <div className="form-group">
                    <label>Title</label>
                    <input type="text" ref={e => this._valueInput = e} className="form-control" />
                </div>
                <div className="form-group">
                    <label>Owner</label>
                    <select ref={e => this._userSelect = e} className="form-control">
                        {this.props.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="card-footer">
                <button type="button" className="btn btn-primary" onClick={e => this.createTask(e)}>Create</button>
            </div>
        </div>;
    }
}

export const NewTask = connect(
    (state: any) => ({ users: selectUsers(state) }),
    ({ createTask })
)(NewTaskComponent);
