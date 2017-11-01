import * as React from "react";
import { connect } from "react-redux";
import { Switch, Route, Link } from "react-router-dom";
import { appError } from "../actions";
import { TaskList } from "./taskList";
import { TaskDetails } from "./taskDetails";

export interface AppProps {
    loading: boolean;
    error: Error | null;
    appError: typeof appError;
}

const AppSplash = () => <div>loading...</div>;

const AppError = (props: { error: Error, clearError: () => void }) => {
    return <div className="card text-white bg-danger">
        <div className="card-header">Oops.. Something just happened</div>
        <div className="card-body">
            <h4 className="card-title"> {props.error.message}</h4>

            {props.error.stack ? (
                <pre className="p-2 bg-light">{props.error.stack}</pre>
            ) : null}
        </div>
        <div className="card-footer">
            <Link to="/" className="btn btn-light" onClick={e => props.clearError()}>Reset</Link>
        </div>
    </div>
};

class AppComponent extends React.Component<AppProps> {

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.props.appError(error);
    }

    clearError() {
        this.props.appError(null);
    }

    render() {
        const { error, loading } = this.props;
        const clearError = this.clearError.bind(this);

        return <div className="container mt-4">
            <h1>
                <Link to="/">Todo example</Link>
            </h1>
            <hr />
            {loading ? <AppSplash /> : (
                error ? (
                    <AppError error={error} clearError={clearError} />
                ) : (
                        <Switch>
                            <Route path="/task/:taskId" component={TaskDetails} />
                            <Route path="/" component={TaskList} />
                        </Switch>
                    ))}
        </div>;
    }
}

export const App = connect(
    (state: TodoApp.State) => ({ loading: state.ui.loading, error: state.ui.error }),
    ({ appError })
)(AppComponent);