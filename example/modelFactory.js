import { DefaultModelFactory, TableModel, TableRecordModel } from "redux-db";
import { schema } from "./schema";

class CustomTableModel extends TableModel {
    constructor(session, state, schema) {
        super(session, state, schema);
    }

    // Override delete operation to add loggint to console.
    delete(id) {
        const deleted = super.delete(id);
        if (deleted)
            console.info(`Record "${this.schema.name}[${id}]" deleted.`);
        else
            console.warn(`Record "${this.schema.name}[${id}]" not deleted.`);
        return deleted;
    }
}

class CustomRecordModel extends TableRecordModel {
    constructor(id, table) {
        super(id, table);
    }

    // Override toString to give a JSON representation of record value.
    toString() {
        return JSON.stringify(this.value);
    }
}

class CustomModelFactory extends DefaultModelFactory {
    newRecord(id, table) {
        return new CustomRecordModel(id, table);
    }

    newTableModel(session, state, schema) {
        return new CustomTableModel(session, state, schema);
    }
}

export const db = createDatabase(schema, {
    factory: new CustomModelFactory()
});