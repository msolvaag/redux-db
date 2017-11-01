import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { deleteTask, updateTask } from "../actions";
import { selectFilteredTasks, TaskViewModel } from "../selectors";

import { TaskMenu } from "./taskListMenu";

export interface TaskListProps {
    tasks: TaskViewModel[];
    deleteTask: typeof deleteTask;
    updateTask: typeof updateTask;
}

class TaskListComponent extends React.Component<TaskListProps> {

    deleteTask(e: React.MouseEvent<Element>, task: TaskViewModel) {
        e.preventDefault();
        this.props.deleteTask(task.id);
    }

    toggleTaskStatus(e: React.MouseEvent<Element>, task: TaskViewModel) {
        e.preventDefault();
        this.props.updateTask({ id: task.id, status: task.status === "open" ? "closed" : "open" });
    }

    render() {
        return <div>
            <TaskMenu />
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th># comments</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.tasks.map(t => (
                            <tr key={t.id}>
                                <td><Link to={`/task/${t.id}`}>{t.title}</Link></td>
                                <td>{t.status}</td>
                                <td>{t.ownerName}</td>
                                <td>{t.numComments}</td>
                                <td className="text-right">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={e => this.toggleTaskStatus(e, t)}>
                                        <i className={t.status === 'open' ? 'fa fa-check' : 'fa fa-undo'}></i>
                                    </button>&nbsp;
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={e => this.deleteTask(e, t)}>
                                        <i className="fa fa-trash-o"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >;
    }
}

export const TaskList = connect(
    (state: any) => ({ tasks: selectFilteredTasks(state) }),
    ({ deleteTask, updateTask })
)(TaskListComponent);