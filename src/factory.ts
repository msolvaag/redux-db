import { TableSchema } from "./schema";

export class ModelFactory {
    private _cache: { [key: string]: RecordModel } = {};

    newTableModel(schema: TableSchema) {
        return this._cache[schema.name] || (this._cache[schema.name] = this._createTableModel(schema));
    }

    private _createTableModel(schema: TableSchema) {
        class ModelClass extends RecordModel {
            constructor(state: any, schema: TableSchema) {
                super(state, schema);
            }
        }

        schema.fields.forEach(field => {
            if (field.constraint === "FK")
                Object.defineProperty(ModelClass.prototype, field.name, {
                    get: function (this: RecordModel) { return factory.new(field, this.session); },
                    set: (value: any) => field.setValue(session, value)
                });
        });

        return ModelClass;
    }
}


const factory = new ModelFactory();
export { factory };