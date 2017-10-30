import * as React from "react";
import { connect } from "react-redux";
import { appError, deleteTask } from "./actions";
import { selectTasks, TaskViewModel } from "./selectors";

export interface AppProps {
    loading: boolean;
    error: Error;
    appError: typeof appError;
}

export interface TaskListProps {
    tasks: TaskViewModel[];
    deleteTask: typeof deleteTask;
}

class TaskListComponent extends React.Component<TaskListProps> {

    deleteTask(e: React.MouseEvent<HTMLButtonElement>, task: TaskViewModel) {
        this.props.deleteTask(task.id);
    }

    render() {
        return <div className="card">
            <table className="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Owner</th>
                        <th># comments</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.tasks.map(t => (
                        <tr key={t.id}>
                            <td>{t.title}</td>
                            <td>{t.owner}</td>
                            <td>{t.numComments}</td>
                            <td className="text-right">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={e => this.deleteTask(e, t)}>
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

const TaskList = connect(
    ({ db }) => ({ tasks: selectTasks(db) }),
    ({ deleteTask })
)(TaskListComponent);

class AppComponent extends React.Component<AppProps> {

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.props.appError(error);
    }

    render() {
        return <div className="container mt-4">
            <h1>Todo example</h1>
            <hr />

            {this.props.loading ? "loading.." : null}
            {this.props.error ? "error" : (
                <TaskList />
            )}
        </div>;
    }
}

export const App = connect(
    ({ app }) => ({ loading: app.loading, error: app.error }),
    ({ appError })
)(AppComponent);