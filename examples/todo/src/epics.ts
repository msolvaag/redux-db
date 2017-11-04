import { ActionsObservable } from "redux-observable";
import { Observable, ajax } from "./vendor";

import { APP_LOAD, APP_ERROR, LOAD_USERS, LOAD_TASKS, DELETE_TASK, UPDATE_TASK, ADD_COMMENT, DELETE_COMMENT, DONE, CREATE_TASK } from "./actions";

const headers = { "Content-Type": "application/json" };
const mapToDone = (action: string, payload?: any) => ({ type: DONE(action), payload: payload });

export const appLoad = (action$: ActionsObservable<any>) =>
    action$.ofType(APP_LOAD)
        .switchMap(action =>
            // Execute in series
            Observable.concat(
                // Execute in parallell
                Observable.merge(
                    ajax.get("http://localhost:3000/tasks?_embed=comments").map(e => mapToDone(LOAD_TASKS, e.response)),
                    ajax.get("http://localhost:3000/users").map(e => mapToDone(LOAD_USERS, e.response))
                ),
                Observable.of(mapToDone(action.type))
            ).catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );

export const createTask = (action$: ActionsObservable<any>) =>
    action$.ofType(CREATE_TASK)
        .switchMap(action =>
            ajax.post("http://localhost:3000/tasks", action.payload, headers)
                .map(e => mapToDone(action.type, e.response))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );
export const deleteTask = (action$: ActionsObservable<any>) =>
    action$.ofType(DELETE_TASK)
        .switchMap(action =>
            ajax.delete("http://localhost:3000/tasks/" + action.payload, headers)
                .map(e => mapToDone(action.type, action.payload))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );
export const updateTask = (action$: ActionsObservable<any>) =>
    action$.ofType(UPDATE_TASK)
        .switchMap(action =>
            ajax.patch(`http://localhost:3000/tasks/${action.payload.id}`, action.payload, headers)
                .map(e => mapToDone(action.type, action.payload))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );

export const addComment = (action$: ActionsObservable<any>) =>
    action$.ofType(ADD_COMMENT)
        .switchMap(action =>
            ajax.post(`http://localhost:3000/comments`, action.payload, headers)
                .map(e => mapToDone(action.type, e.response))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );
export const deleteComment = (action$: ActionsObservable<any>) =>
    action$.ofType(DELETE_COMMENT)
        .switchMap(action =>
            ajax.delete(`http://localhost:3000/comments/${action.payload}`, headers)
                .map(e => mapToDone(action.type, action.payload))
                .catch(e => Observable.of(({ type: APP_ERROR, payload: e })))
        );