import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from 'react-redux';
import { BrowserRouter } from "react-router-dom";
import { Route } from "react-router";

import { store } from "./store";
import { App } from "./components/app";
import { APP_LOAD, APP_ERROR } from "./actions";

store.dispatch({ type: APP_LOAD });

const appRootElement = document.getElementById("root");

window.onerror = function (msg, file, line, col, error) {
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