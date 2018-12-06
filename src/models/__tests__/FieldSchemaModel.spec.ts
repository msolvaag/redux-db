// tslint:disable:object-literal-key-quotes
import { createDatabase } from "../..";
import { TYPE_MODIFIED, TYPE_PK } from "../../constants";
import errors from "../../errors";
import Database from "../Database";
import FieldSchemaModel from "../FieldSchemaModel";

const TABLE1 = "TABLE1";
const TABLE2 = "TABLE2";

const schema = {
    [TABLE1]: {
        id: { pk: true }
    },
    [TABLE2]: {
        ref: { pk: true, references: TABLE1 }
    }
};

const invalidTypes: Record<string, any> = {
    "string": ["", null, 123, NaN, {}, new Date(), () => 0],
    "function": ["", null, 123, NaN, {}, new Date()]
};

describe("constructor", () => {

    test("throws if no table instance given", () => {
        const model = FieldSchemaModel as any;
        expect(() => new model())
            .toThrow(errors.argument("table", "object"));
    });

    test("throws if no name given", () => {
        const model = FieldSchemaModel as any;
        expect(() => new model({}))
            .toThrow(errors.argument("name", "string"));
    });

    test("throws if no field definition given", () => {
        const model = FieldSchemaModel as any;
        expect(() => new model({}, "field"))
            .toThrow(errors.argument("schema", "object"));
    });

    describe("invalid field definition", () => {
        const db = createDatabase(schema);
        const table = db.getTableSchema(TABLE1);

        test.each([
            ["fieldName", "string", {}],
            ["propName", "string", {}],
            ["value", "function", {}],
            ["references", "string", {}],
            ["relationName", "string", { references: "table2" }]
        ])('throws if "schema.%s" is given invalid %s', (field: string, type: string, def: any) => {
            invalidTypes[type].forEach((val: any) => {
                expect(() => new FieldSchemaModel(table, "field", { ...def, [field]: val }))
                    .toThrow(errors.argument(`schema.${field}`, type));
            });
        });
    });

    describe("assignment", () => {
        const db = createDatabase(schema);
        const table = db.getTableSchema(TABLE1);

        const name = "FIELD";
        const type = TYPE_MODIFIED;
        const pk = true;
        const relationName = "refs";
        const cascade = true;
        const unique = true;
        const notNull = false;
        const references = TABLE2;

        const field = new FieldSchemaModel(table, name, { type });

        test("field.type is set", () =>
            expect(field.type).toEqual(type));
        test("field.name is set", () =>
            expect(field.name).toEqual(name));
        test("field.name is set to def.fieldName", () => {
            const fieldName = "Field";
            const withFieldName = new FieldSchemaModel(table, name, { fieldName });
            expect(withFieldName.name).toEqual(fieldName);
        });
        test("field.propName is defaulted to name", () =>
            expect(field.propName).toEqual(name));
        test("field.propName is set to def.propName", () => {
            const propName = "Prop";
            const withPropName = new FieldSchemaModel(table, name, { propName });
            expect(withPropName.propName).toEqual(propName);
        });
        test("field.isPrimaryKey is set if def.pk is true", () => {
            const pkField = new FieldSchemaModel(table, name, { pk: true });
            expect(pkField.isPrimaryKey).toEqual(true);
        });
        test("field.isPrimaryKey is set if def.type is TYPE_PK", () => {
            const pkField = new FieldSchemaModel(table, name, { type: TYPE_PK });
            expect(pkField.isPrimaryKey).toEqual(true);
        });
        test("field.isStamp is set if def.stamp is true", () => {
            const stampField = new FieldSchemaModel(table, name, { stamp: true });
            expect(stampField.isStamp).toEqual(true);
        });
        test("field.isStamp is set if def.type is TYPE_MODIFIED", () => {
            const stampField = new FieldSchemaModel(table, name, { type: TYPE_MODIFIED });
            expect(stampField.isStamp).toEqual(true);
        });
        test("field._valueFactory is set if def.value is a function", () => {
            const stampField: any = new FieldSchemaModel(table, name, { value: () => 0 });
            expect(stampField._valueFactory).toBeInstanceOf(Function);
        });
        test("field.isForeignKey is set when def.references has value", () => {
            const pkField = new FieldSchemaModel(table, name, { references: TABLE2 });
            expect(pkField.isForeignKey).toEqual(true);
        });

        describe("field is a key", () => {
            const key = new FieldSchemaModel(table, "field", {
                pk,
                relationName,
                cascade,
                unique,
                notNull
            });

            test("field.relationName is set when field is foreign key and has value", () => {
                const fkey = new FieldSchemaModel(table, "field", { references, relationName });
                expect(fkey.relationName).toEqual(relationName);
            });
            test("field.relationName is not set when field is not a foreign key", () => {
                const pkey = new FieldSchemaModel(table, "field", { pk, relationName });
                expect(pkey.relationName).toBeUndefined();
            });
            test("field.cascade is set when def.cascade has value", () =>
                expect(key.cascade).toEqual(cascade));
            test("field.unique is set when def.unique has value", () =>
                expect(key.unique).toEqual(unique));
            test("field.notNull is set when def.notNull has value", () =>
                expect(key.notNull).toEqual(notNull));
        });

        describe("field is not a key", () => {

            const attr = new FieldSchemaModel(table, "field", {
                relationName,
                cascade,
                unique,
                notNull
            });

            test("field.isPrimaryKey is false", () =>
                expect(attr.isPrimaryKey).toEqual(false));
            test("field.isForeignKey is false", () =>
                expect(attr.isForeignKey).toEqual(false));

            test("field.relationName is undefined", () =>
                expect(attr.relationName).toBeUndefined());
            test("field.cascade is false", () =>
                expect(attr.cascade).toEqual(false));
            test("field.unique is false", () =>
                expect(attr.unique).toEqual(false));
            test("field.notNull is set when def.notNull has value", () =>
                expect(attr.notNull).toEqual(notNull));
        });
    });
});

describe("connect", () => {
    const db = createDatabase(schema);
    const table = db.getTableSchema(TABLE1);
    const refTable = db.getTableSchema(TABLE2);

    const field = new FieldSchemaModel(table, "field", {
        references: TABLE2
    });

    field.connect(db.tableMap);

    test("assigns refTable to referenced table schema", () =>
        expect(field.refTable).toStrictEqual(refTable));

    test("throws if references unknown schema", () =>
        expect(() => field.connect({}))
            .toThrow(errors.fkInvalidReference(field.table.name, field.name, field.references as string)));

    test("does not assign refTable", () => {
        const attr = new FieldSchemaModel(table, "field", {});
        attr.connect(db.tableMap);
        expect(attr.refTable).toBeUndefined();
    });
});

describe("getValue", () => {
    const db = createDatabase(schema);
    const table = db.getTableSchema(TABLE1);
    const fieldName = "field";
    const fieldValue = "value";
    const field = new FieldSchemaModel(table, fieldName, {});

    test("returns value of record field value", () =>
        expect(field.getValue({ [fieldName]: fieldValue })).toEqual(fieldValue));

    test("invokes valueFactory if defined", () => {
        const customValue = "COMPOSITE";
        const value = jest.fn(d => customValue);
        const fieldWithFactory = new FieldSchemaModel(table, fieldName, { value });
        const data = { [fieldName]: fieldValue };
        const record = { value: data };

        expect(fieldWithFactory.getValue(data, record)).toEqual(customValue);
        expect(value).toHaveBeenCalledWith(data, { record, schema: fieldWithFactory });
    });
});

describe("getRecordValue", () => {
    const db = createDatabase(schema);
    const table = db.getTableSchema(TABLE1);
    const fieldName = "field";
    const fieldValue = "value";

    const field = new FieldSchemaModel(table, fieldName, {});
    const data = { [fieldName]: fieldValue };
    const record = { value: data };

    const spy = jest.spyOn(field, "getValue");

    test("returns value of record field value", () =>
        expect(field.getRecordValue(record)).toEqual(fieldValue));
    test("invokes field.getValue with record.value and record", () =>
        expect(spy).toHaveBeenCalledWith(data, record));
});
