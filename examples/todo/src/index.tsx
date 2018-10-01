import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Route } from "react-router";
import { BrowserRouter } from "react-router-dom";

import { APP_ERROR, APP_LOAD } from "./actions";
import { App } from "./components/app";
import { store } from "./store";

store.dispatch({ type: APP_LOAD });

const appRootElement = document.getElementById("root");

window.onerror = (msg, file, line, col, error) => {
    if (!error)
        error = new Error(msg.toString());
    store.dispatch({ type: APP_ERROR, payload: error });
};

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
            <Route path="/" component={App} />
        </BrowserRouter>
    </Provider>,
    appRootElement
);
