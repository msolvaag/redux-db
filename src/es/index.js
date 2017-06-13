import { TableSchema } from "./schema";
import { Session, RecordModel, RecordSet, TableModel } from "./models";
const defaultOptions = {};
export const createDatabase = (schema, options) => {
    return new Database(schema, options || defaultOptions);
};
export class Database {
    constructor(schema, options) {
        this.options = options;
        this.tables = Object.keys(schema).map(tableName => new TableSchema(tableName, schema[tableName]));
        this.tables.forEach(table => table.connect(this.tables));
    }
    combineReducers(...reducers) {
        return (state = {}, action) => {
            const session = this.createSession(state);
            reducers.forEach(reducer => {
                reducer(session.tables, action);
            });
            return session.commit();
        };
    }
    createSession(state) {
        return new Session(state, this);
    }
}
export { RecordModel as Record, RecordSet, TableModel as Table };
