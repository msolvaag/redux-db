// Data models
declare namespace TodoApp {

    interface User {
        id: number;
        name: string;
    }

    interface Task {
        id: number;
        projectId: number;
        title: string;
        status: string;
    }

    interface Comment {
        id: number;
        taskId: number;
        value: string;
        author: number;
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