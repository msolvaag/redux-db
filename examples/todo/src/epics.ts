import { ActionsObservable, ofType } from "redux-observable";
import * as actions from "./actions";
import { ajax, catchError, map, Observable, switchMap } from "./vendor";

const API_BASE = "http://localhost:3000";

const headers = { "Content-Type": "application/json" };
const mapToDone = (action: string, payload?: any) => ({ type: actions.DONE(action), payload });

export const appLoad = (action$: ActionsObservable<any>) => action$.pipe(
    ofType(actions.APP_LOAD),
    switchMap(action =>
        // Execute in series
        Observable.concat(
            // Execute in parallell
            Observable.merge(
                ajax.get(`${API_BASE}/tasks?_embed=comments`).pipe(
                    map(e => mapToDone(actions.LOAD_TASKS, e.response))),
                ajax.get(`${API_BASE}/users`).pipe(
                    map(e => mapToDone(actions.LOAD_USERS, e.response)))
            ),
            Observable.of(mapToDone(action.type))
        ).catch(e => Observable.of(({ type: actions.APP_ERROR, payload: e })))
    ));

export const createTask = (action$: ActionsObservable<any>) => action$.pipe(
    ofType(actions.CREATE_TASK),
    switchMap(action =>
        ajax.post(`${API_BASE}/tasks`, action.payload, headers).pipe(
            map(e => mapToDone(action.type, e.response)),
            catchError(e => Observable.of(({ type: actions.APP_ERROR, payload: e }))))
    ));

export const deleteTask = (action$: ActionsObservable<any>) => action$.pipe(
    ofType(actions.DELETE_TASK),
    switchMap(action =>
        ajax.delete(`${API_BASE}/tasks/${action.payload}`, headers).pipe(
            map(e => mapToDone(action.type, action.payload)),
            catchError(e => Observable.of(({ type: actions.APP_ERROR, payload: e }))))
    ));

export const updateTask = (action$: ActionsObservable<any>) => action$.pipe(
    ofType(actions.UPDATE_TASK),
    switchMap(action =>
        ajax.patch(`${API_BASE}/tasks/${action.payload.id}`, action.payload, headers).pipe(
            map(e => mapToDone(action.type, action.payload)),
            catchError(e => Observable.of(({ type: actions.APP_ERROR, payload: e }))))
    ));

export const addComment = (action$: ActionsObservable<any>) => action$.pipe(
    ofType(actions.ADD_COMMENT),
    switchMap(action =>
        ajax.post(`${API_BASE}/comments`, action.payload, headers).pipe(
            map(e => mapToDone(action.type, e.response)),
            catchError(e => Observable.of(({ type: actions.APP_ERROR, payload: e }))))
    ));

export const deleteComment = (action$: ActionsObservable<any>) => action$.pipe(
    ofType(actions.DELETE_COMMENT),
    switchMap(action =>
        ajax.delete(`${API_BASE}/comments/${action.payload}`, headers).pipe(
            map(e => mapToDone(action.type, action.payload)),
            catchError(e => Observable.of(({ type: actions.APP_ERROR, payload: e }))))
    ));
