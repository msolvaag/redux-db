// Data models
declare namespace TodoApp {

    interface User {
        id: number;
        name: string;
    }

    interface Task {
        id: number;
        title: string;
        status: "open" | "closed";
        owner: number;
    }

    interface Comment {
        id: number;
        taskId: number;
        value: string;
        author: number;
    }

    interface Label {
        id: number;
        type: string;
        name: string;
    }

    interface UIState {
        loading: boolean;
        error: Error | null;
        taskFilter: string | null;
    }

    interface State {
        ui: UIState;
        db: any;
    }
}

declare interface Action {
    type: string;
    payload: any;
}