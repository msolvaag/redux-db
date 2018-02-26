export type FieldType = "ATTR" | "MODIFIED" | "PK";

export interface ForeignKey {
    name: string;
    value: any;
    refTable?: TableSchema;
    unique: boolean;
    notNull: boolean;
}

export interface TableSchema {
    db: DatabaseSchema;
    name: string;
    fields: FieldSchema[];
    relations: FieldSchema[];

    connect(schemas: TableSchema[]): void;
    getPrimaryKey(record: any): string;
    getForeignKeys(record: any): ForeignKey[];
    isModified(x: any, y: any): boolean;
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    injectKeys(data: any, record: TableRecord): void;
    normalize(data: any, context: NormalizeContext): string[];
}

export interface FieldSchema {
    table: TableSchema;
    type: FieldType;
    name: string;
    propName: string;
    references?: string;
    relationName?: string;
    refTable?: TableSchema;

    isPrimaryKey: boolean;
    isForeignKey: boolean;
    cascade: boolean;
    unique: boolean;
    notNull: boolean;

    connect(schemas: TableSchema[]): void;
    getValue(data: any, record?: any): any;
    getRecordValue(record: any): any;
}

export type RecordValue = Record<string, any>;

export interface Table<T extends RecordValue = RecordValue, R extends TableRecord<T> = TableRecord<T>> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;

    get(id: string | number): R;
    getOrDefault(id: string | number): R | null;
    getByFk(fieldName: string, id: string | number): TableRecordSet<R, T>;
    getFieldValue<F extends keyof T>(id: string | number, field: F): T[F] | undefined;
    getValue(id: string | number): T | undefined;
    getValues(): T[];

    all(): R[];
    filter(callback: (record: R) => boolean): R[];
    map<M>(mapFn: (record: R, index: number) => M): M[];
    exists(id: string | number): boolean;
    index(name: string, fk: string): string[];

    insert(data: T | T[]): R;
    insertMany(data: T | T[]): R[];

    update(data: Partial<T> | Partial<T>[]): R;
    updateMany(data: Partial<T> | Partial<T>[]): R[];

    upsert(data: Partial<T> | Partial<T>[]): R;
    upsertRaw(data: any): R[];

    delete(id: string | number | Partial<T>): boolean;
    deleteAll(): void;

    upsertNormalized(table: TableState<T>): void;
}

export interface TableRecord<T extends RecordValue=RecordValue> {
    id: string;
    table: Table<T>;
    value: T;

    update(data: Partial<T>): TableRecord<T>;
    delete(): void;
}

export interface TableRecordSet<R extends TableRecord<T>=any, T=any> {
    value: T[];
    ids: string[]
    length: number;

    all(): R[];

    add(data: T | T[]): void;
    remove(data: Partial<T>): void;

    update(data: Partial<T> | Partial<T>[]): TableRecordSet<R, T>;
    delete(): void;

    map<M>(callback: (record: R) => M): M[];
    filter(callback: (record: R) => boolean): R[];
}

export interface ModelFactory {
    newTableModel(session: Session, state: TableState, schema: TableSchema): Table;
    newTableSchema(db: DatabaseSchema, name: string, schema: TableDDL): TableSchema;
    newRecordModel(id: string, table: Table): TableRecord;
}

/// Defines a database schema
export interface SchemaDDL {
    [key: string]: TableDDL;
}

/// Defines a table schema
export interface TableDDL {
    [key: string]: FieldDDL;
}

/// Defines a field (column) schema
export interface FieldDDL {

    /// Defines the field type. 
    type?: FieldType,

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

export interface NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState;
    emits: { [key: string]: any[] };
    normalizePKs: boolean;

    emit(tableName: string, record: any): void;
}

/// Represents a custom normalize callback
export interface Normalizer {
    (record: any, context: NormalizeContext): any;
}

/// Represents a callback for handling missing Primary Keys
export interface MissingKeyHook {
    (record: any, schema: TableSchema): string | null | undefined;
}

/// Represents the schema instance for a database.
export interface DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;

    normalizeHooks?: { [key: string]: Normalizer };
    onMissingPk?: MissingKeyHook;
    factory: ModelFactory;
}

/// Represents the available options for creating a new database.
export interface DatabaseOptions {
    onNormalize?: { [key: string]: Normalizer };
    onMissingPk?: MissingKeyHook;

    cascadeAsDefault?: boolean;
    factory?: ModelFactory;
}

/// Represents the available options for creating a new session.
export interface SessionOptions {
    readOnly: boolean;
}

/// Represents the state structure for a database.
export interface DatabaseState {
    [key: string]: TableState;
}

/// Represents the state structure for a table.
export interface TableState<T=any> {
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
    [key: string]: Table
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

export interface Reducer {
    (session: any, action: any, arg?: any): void;
}