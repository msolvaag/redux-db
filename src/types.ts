export type FieldType = "ATTR" | "MODIFIED" | "PK";
export type RecordValue = Record<string, any>;

export type Reducer = (session: any, action: any, arg?: any) => void;
export type PkGenerator = (record: any, schema: TableSchema) => string | null | undefined;
export type Normalizer = (record: any, context: NormalizeContext) => any;
export type RecordComparer = (a: any, b: any, schema: TableSchema) => boolean;

export interface MapOf<T> { [key: string]: T; }

export interface ForeignKey {
    name: string;
    value: any;
    refTable?: TableSchema;
    unique: boolean;
    notNull: boolean;
}

// Holds the schema definition for a table.
export interface TableSchema {
    db: DatabaseSchema;
    name: string;
    fields: FieldSchema[];
    relations: FieldSchema[];

    /// Connects this schema's fields with other tables.
    /// Used internally in the setup of the schema object model.
    connect(schemas: TableSchema[]): void;
    /// Gets the value of the PK for the given record.
    getPrimaryKey(record: any): string;
    /// Gets the values of the FK's for the given record.
    getForeignKeys(record: any): ForeignKey[];
    /// Determines whether two records are equal, not modified.
    isModified(x: any, y: any): boolean;
    /// Infers the owner PK into the given nested relations
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    injectKeys(data: any, record: TableRecord): void;
    /// Normalizes the given data and outputs to context.
    /// Returns the PKs for the normalized records.
    normalize(data: any, context: NormalizeContext): string[];
}

// Holds the schema definition for a table field (column)
export interface FieldSchema {
    /// Gets the table this field belongs to.
    table: TableSchema;
    /// Gets the field type ( PK, ATTR, MODIFIED ).
    type: FieldType;
    /// Gets the field name.
    name: string;
    /// Gets the field property name.
    propName: string;

    /// Gets the name of the table this field references.
    references?: string;
    /// Gets the name of the relation to a other table.
    relationName?: string;
    /// Gets the instance of the table schema this field references.
    refTable?: TableSchema;

    isPrimaryKey: boolean;
    isForeignKey: boolean;
    cascade: boolean;
    unique: boolean;
    notNull: boolean;

    /// Connects this schema with the referenced table.
    /// Used internally in the setup of the schema object model.
    connect(schemas: TableSchema[]): void;
    /// Gets the value of the field for the given data.
    getValue(data: any, record?: any): any;
    /// Gets the value of the field for a given table record.
    getRecordValue(record: any): any;
}

/// Represents an inmutable wrapper for a table in the db.
export interface Table<T extends RecordValue = RecordValue, R extends TableRecord<T> = TableRecord<T>> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;

    /// Gets a single record by it's PK.
    get(id: string | number): R;
    /// Gets a single record by it's PK. Returns null if not found.
    getOrDefault(id: string | number): R | null;
    /// Gets a set of records referenced by a given field.
    getByFk(fieldName: string, id: string | number): TableRecordSet<R, T>;
    /// Gets the value of a given field.
    getFieldValue<F extends keyof T>(id: string | number, field: F): T[F] | undefined;
    /// Gets the value of a record by it's PK.
    getValue(id: string | number): T | undefined;
    /// Gets all values in table.
    getValues(): T[];
    /// Gets the index used for a given foreign key.
    getIndex(schemaName: string, fkId: string): string[];

    /// Gets all records in table.
    all(): R[];
    /// Checks whether a record exists in table.
    exists(id: string | number): boolean;

    /// Inserts single or multiple records.
    /// Returns the inserted records.
    insert(data: T | T[]): R[];
    /// Updates single or multiple records.
    /// Returns the updated records.
    update(data: Partial<T> | Partial<T>[]): R[];
    /// Upserts single or multiple records.
    /// Returns the upserted records.
    upsert(data: Partial<T> | Partial<T>[]): R[];
    /// Deletes a single record by id or object.
    /// Returns true if record is successfully deleted.
    delete(id: string | number | Partial<T>): boolean;
    /// Deletes all records in table.
    deleteAll(): void;

    /// Upserts the table state from another normalized state.
    upsertNormalized(table: TableState<T>): void;
}

export interface TableRecord<T extends RecordValue = RecordValue> {
    id: string;
    table: Table<T>;
    value: T;

    update(data: Partial<T>): TableRecord<T>;
    delete(): void;
}

export interface TableRecordSet<R extends TableRecord<T> = any, T = any> {
    ids: string[];
    length: number;

    /// Gets all records in set
    all(): R[];
    /// Gets all record values in set
    getValue(): T[];

    /// Adds single or multiple records to set.
    /// Returns added records.
    add(data: T | T[]): void;
    /// Removes a record from this set.
    remove(data: Partial<T>): void;
    /// Updates single or multiple records in set.
    /// Returns updated records.
    update(data: Partial<T> | Partial<T>[]): TableRecordSet<R, T>;
    /// Deletes all records in this set.
    delete(): void;
}

export interface ModelFactory {
    newTableModel(session: Session, schema: TableSchema, state: TableState): Table;
    newTableSchema(db: DatabaseSchema, name: string, schema: TableDefinition): TableSchema;
    newRecordModel(id: string, table: Table): TableRecord;
    newRecordSetModel(table: Table, schema: FieldSchema, owner: { id: string }): TableRecordSet;
}

/// Defines a database schema
export interface Schema {
    [key: string]: TableDefinition;
}

/// Defines a table schema
export interface TableDefinition {
    [key: string]: FieldDefinition;
}

/// Defines a field (column) schema
export interface FieldDefinition {

    /// Defines the field type.
    type?: FieldType;

    /// Defines a custom property name for the field. Defaults to the field name.
    propName?: string;

    /// Defines the foreign table this field references.
    references?: string;

    /// Defines the relationship name, which'll be the property name on the foreign table.
    relationName?: string;

    /// If set, causes the record to be deleted if the foreign table row is deleted.
    cascade?: boolean;

    /// If set, declares that this relation is a one 2 one relationship.
    unique?: boolean;

    /// If set, declares that this field is nullable or not.
    notNull?: boolean;

    /// Defines a custom value factory for each record.
    value?: (record: any, context?: ComputeContext<any>) => any;
}

/// Represents a context used in a custom value factory.
export interface ComputeContext<T> {
    schema: FieldSchema;
    record?: TableRecord<T>;
}

/// Holds context state when normalizing data
export interface NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState;
    emits: { [key: string]: any[] };
    normalizePKs: boolean;

    /// Emits data for further normalization
    emit(tableName: string, record: any): void;
}

/// Represents the schema instance for a database.
export interface DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    factory: ModelFactory;

    getNormalizer: (schemaName: string) => Normalizer | undefined;
    getPkGenerator: (schemaName: string) => PkGenerator | undefined;
    getRecordComparer: (schemaName: string) => RecordComparer | undefined;
}

/// Represents the available options for creating a new database.
export interface DatabaseOptions {
    onNormalize?: MapOf<Normalizer> | Normalizer;
    onGeneratePK?: MapOf<PkGenerator> | PkGenerator;
    onRecordCompare?: MapOf<RecordComparer> | RecordComparer;

    cascadeAsDefault?: boolean;
    factory?: ModelFactory;
}

/// Represents the available options for creating a new session.
export interface SessionOptions {
    readOnly: boolean;
    tableSchemas?: TableSchema[];
}

/// Represents the state structure for a database.
export interface DatabaseState {
    [key: string]: TableState;
}

/// Represents the state structure for a table.
export interface TableState<T = any> {
    name?: string;
    byId: { [key: string]: T };
    ids: string[];
    indexes: TableIndex;
}

/// Represents an index structure for a single table.
export interface TableIndex {
    [key: string]: {
        unique: boolean,
        values: { [key: string]: string[] }
    };
}

/// Represents a map of tables. Keyed by name.
export interface TableMap {
    [key: string]: Table;
}

/// Represents a session
export interface Session {
    db: DatabaseSchema;
    state: DatabaseState;
    tables: TableMap;

    upsert(ctx: NormalizeContext): void;
    commit(): DatabaseState;
}

/// Represents a normalized state
export interface NormalizedState {
    [key: string]: { // schema name
        ids: string[],
        byId: {
            [key: string]: any
        },
        indexes: TableIndex;
    };
}

export interface RecordClass {
    new(id: string, table: Table): TableRecord;
}

export interface ExtendedRecord extends TableRecord {
    _fields: { [key: string]: any };
}
