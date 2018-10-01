import { ActionsObservable } from "redux-observable";
import * as actions from "./actions";
import { ajax, Observable } from "./vendor";

const headers = { "Content-Type": "application/json" };
const mapToDone = (action: string, payload?: any) => ({ type: actions.DONE(action), payload });

export const appLoad = (action$: ActionsObservable<any>) =>
    action$.ofType(actions.APP_LOAD)
        .switchMap(action =>
            // Execute in series
            Observable.concat(
                // Execute in parallell
                Observable.merge(
                    ajax.get("http://localhost:3000/tasks?_embed=comments").map(e =>
                        mapToDone(actions.LOAD_TASKS, e.response)),
                    ajax.get("http://localhost:3000/users").map(e =>
                        mapToDone(actions.LOAD_USERS, e.response))
                ),
                Observable.of(mapToDone(action.type))
            ).catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
        );

export const createTask = (action$: ActionsObservable<any>) =>
    action$.ofType(actions.CREATE_TASK)
        .switchMap(action =>
            ajax.post("http://localhost:3000/tasks", action.payload, headers)
                .map(e => mapToDone(action.type, e.response))
                .catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
        );
export const deleteTask = (action$: ActionsObservable<any>) =>
    action$.ofType(actions.DELETE_TASK)
        .switchMap(action =>
            ajax.delete("http://localhost:3000/tasks/" + action.payload, headers)
                .map(e => mapToDone(action.type, action.payload))
                .catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
        );
export const updateTask = (action$: ActionsObservable<any>) =>
    action$.ofType(actions.UPDATE_TASK)
        .switchMap(action =>
            ajax.patch(`http://localhost:3000/tasks/${action.payload.id}`, action.payload, headers)
                .map(e => mapToDone(action.type, action.payload))
                .catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
        );

export const addComment = (action$: ActionsObservable<any>) =>
    action$.ofType(actions.ADD_COMMENT)
        .switchMap(action =>
            ajax.post(`http://localhost:3000/comments`, action.payload, headers)
                .map(e => mapToDone(action.type, e.response))
                .catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
        );
export const deleteComment = (action$: ActionsObservable<any>) =>
    action$.ofType(actions.DELETE_COMMENT)
        .switchMap(action =>
            ajax.delete(`http://localhost:3000/comments/${action.payload}`, headers)
                .map(e => mapToDone(action.type, action.payload))
                .catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
        );
