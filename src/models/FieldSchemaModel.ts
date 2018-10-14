import { TYPE_ATTR, TYPE_MODIFIED, TYPE_PK } from "../constants";
import errors from "../errors";
import { ComputeContext, FieldDefinition, FieldSchema, FieldType, MapOf, TableSchema } from "../types";
import { ensureParamFunction, ensureParamObject, ensureParamString, optionalParamString } from "../utils";

export default class FieldSchemaModel implements FieldSchema {
    readonly table: TableSchema;
    readonly name: string;
    readonly propName: string;

    readonly type: FieldType;

    readonly references?: string;
    readonly relationName?: string;
    readonly cascade: boolean;
    readonly unique: boolean;
    readonly notNull: boolean;

    readonly isPrimaryKey: boolean;
    readonly isForeignKey: boolean;
    readonly isStamp: boolean;

    private _refTable?: TableSchema;
    private _valueFactory?: <T, M>(record: T, context?: ComputeContext<T>) => M;

    constructor(table: TableSchema, name: string, schema: FieldDefinition, cascadeAsDefault: boolean = false) {
        this.table = ensureParamObject("table", table);
        ensureParamString("name", name);
        ensureParamObject("schema", schema);

        this.type = schema.type || TYPE_ATTR;
        this.name = optionalParamString("schema.fieldName", schema.fieldName, name);
        this.propName = optionalParamString("schema.propName", schema.propName, name);
        this.references = optionalParamString("schema.references", schema.references);

        this.isPrimaryKey = schema.pk === true || schema.type === TYPE_PK;
        this.isForeignKey = !!this.references;
        this.isStamp = schema.stamp === true || schema.type === TYPE_MODIFIED;
        this._valueFactory = schema.value !== undefined
            ? ensureParamFunction("schema.value", schema.value).bind(this)
            : undefined;

        if (this.isPrimaryKey || this.isForeignKey) {
            if (this.isForeignKey)
                this.relationName = optionalParamString("schema.relationName", schema.relationName);
            this.cascade = schema.cascade === undefined ? cascadeAsDefault : schema.cascade === true;
            this.unique = schema.unique === true;

            // not null is default true, for PK's and FK's
            this.notNull = schema.notNull === undefined ? true : schema.notNull === true;
        } else {
            this.cascade = false;
            this.unique = false;
            this.notNull = schema.notNull === true;
        }
    }

    get refTable() { return this._refTable; }

    connect(schemas: MapOf<TableSchema>) {
        if (this.references) {
            this._refTable = schemas[this.references];
            if (!this._refTable)
                throw new Error(errors.fkInvalidReference(this.table.name, this.name, this.references));
        }
    }

    getValue(data: any, record?: any): any {
        return this._valueFactory ? this._valueFactory(data, {
            record,
            schema: this
        }) : data[this.name];
    }

    getRecordValue(record: { value: any }) {
        return this.getValue(record.value, record);
    }
}
