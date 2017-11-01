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

class AppComponent extends React.Component<AppProps> {

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.props.appError(error);
    }

    render() {

        return <div className="container mt-4">
            <h1>
                <Link to="/">Todo example</Link>
            </h1>
            <hr />
            {this.props.loading ? "loading..." : (
                this.props.error ? this.props.error.message : (
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