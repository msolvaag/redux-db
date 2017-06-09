import { DatabaseSchema } from "./schema";

export interface DatabaseState {
    [key: string]: TableState;
}

export interface TableState {
    byId: { [key: string]: any };
    ids: string[];
}


export class Session {
    tables: any;
    state: DatabaseState;

    constructor(state: DatabaseState = {}, schema: DatabaseSchema) {
        this.state = state;
        this.tables = schema.tables.map(t => new TableModel(state[t.name], t));
    }

    update(data: any) {

    }
}