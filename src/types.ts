export type FieldType = "ATTR" | "MODIFIED" | "PK";
export type RecordValue = Record<string, any>;
export type ValueType<R> = R extends { value: infer T } ? T : never;
export type Values<R> = ValueType<R> | ValueType<R>[];
export type PartialValue<R> = Partial<ValueType<R>>;
export type PartialValues<R> = PartialValue<R> | (PartialValue<R>[]);

export interface RecordEntity { id: string; }

export type Reducer = (session: any, action: any, arg?: any) => void;
export type PkGenerator = (record: any, schema: TableSchema) => string | null | undefined;
export type RecordNormalizer = (record: any, context: NormalizeContext) => any;
export type RecordComparer = (a: any, b: any, schema: TableSchema) => boolean;
export type RecordMerger = (a: any, b: any, schema: TableSchema) => any;

export interface MapOf<T> { [key: string]: T; }

export interface ForeignKey {
    name: string;
    value: string;
    references: string;
    refTable: TableSchema;
    unique: boolean;
    notNull: boolean;
}

// Holds the schema definition for a table.
export interface TableSchema {
    db: DatabaseSchema;
    name: string;
    fields: FieldSchema[];
    relations: FieldSchema[];
    primaryKeys: FieldSchema[];

    /// Connects this schema's fields with other tables.
    /// Used internally in the setup of the schema object model.
    connect(schemas: MapOf<TableSchema>): void;
    /// Gets the value of the PK for the given record.
    getPrimaryKey(record: any): string;
    /// Gets the values of the FK's for the given record.
    getForeignKeys(record: any): ForeignKey[];
    /// Determines whether two records are equal, not modified.
    isModified(recordA: any, recordB: any): boolean;
    /// Infers the owner PK into the given nested relations
    inferRelations(data: any, rel: FieldSchema, ownerId: string): any[];
    injectKeys(data: any, record: TableRecord): void;
    /// Normalizes the given data and outputs to context.
    /// Returns the PKs for the normalized records.
    normalize(data: any, context: NormalizeContext): string[];
    /// Merges two records producing an updated version.
    mergeRecord(oldRecord: any, newRecord: any): any;
}

// Holds the schema definition for a table field (column)
export interface FieldSchema {
    /// Gets the table this field belongs to.
    table: TableSchema;

    /// Gets the table schema this field references.
    refTable?: TableSchema;

    /// Gets the field name.
    name: string;
    /// Gets the field property name.
    propName: string;

    /// Gets the name of the table this field references.
    references?: string;

    /// Defines the relationship name, which'll be the property name on the foreign table.
    relationName?: string;

    /// If set, causes the record to be deleted if the foreign table row is deleted.
    cascade?: boolean;

    /// If set, declares that this relation is a one 2 one relationship.
    unique?: boolean;

    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isStamp: boolean;
    notNull: boolean;

    /// Connects this schema with the referenced table.
    /// Used internally in the setup of the schema object model.
    connect(schemas: MapOf<TableSchema>): void;
    /// Gets the value of the field for the given data.
    getValue(data: any, record?: any): any;
    /// Gets the value of the field for a given table record.
    getRecordValue(record: any): any;
}

/// Represents an immutable wrapper for a db table.
export interface Table<R extends TableRecord = TableRecord> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;

    /// Gets a single record by it's PK.
    get(id: string | number): R | undefined;
    /// Gets the value of a record by it's PK(.
    getValue(id: string | number): ValueType<R> | undefined;
    /// Gets the index used for a given foreign key.
    getIndex(schemaName: string, fkId: string): string[];

    /// Gets all records in table.
    all(): R[];
    /// Gets all values in table.
    values(): ValueType<R>[];
    /// Checks whether a record exists in table.
    exists(id: string | number): boolean;

    /// Inserts single or multiple records.
    /// Returns the inserted records.
    insert(data: Values<R>, argument?: any): string[];
    /// Updates single or multiple records.
    /// Returns the updated records.
    update(data: PartialValues<R>, argument?: any): string[];
    /// Upserts single or multiple records.
    /// Returns the upserted records.
    upsert(data: PartialValues<R>, argument?: any): string[];
    /// Deletes single or multiple records by id or object.
    /// Returns number of successfully deleted records.
    delete(data: string | number | PartialValue<R> | (string | number | PartialValue<R>)[]): number;
    /// Deletes all records in table.
    deleteAll(): void;

    /// Upserts the table state from another normalized state.
    upsertNormalized(table: TableState<ValueType<R>>): void;
}

/// Represents a wrapped record belonging to a table.
export interface TableRecord<T extends RecordValue = RecordValue> {
    id: string;
    table: Table;
    value: T;

    update(data: Partial<T>): this;
    delete(): void;
}

export interface TableRecordField {
    name: string;
    value: any;
}

/// Represents a wrapper set of records belonging to a table.
export interface TableRecordSet<R extends TableRecord = TableRecord> {
    /// Gets all ids in set.
    ids: string[];
    /// Gets the number of records in set.
    length: number;

    /// Gets all records in set.
    all(): R[];
    /// Gets all record values in set.
    values(): ValueType<R>[];

    /// Adds single or multiple records to set.
    /// Returns primary keys of added records.
    add(data: Values<R>): string[];
    /// Removes a record from this set.
    /// Returns number of removed records.
    remove(data: PartialValue<R>): number;
    /// Updates single or multiple records in set.
    /// Returns primary keys of updated records.
    update(data: PartialValues<R>): string[];
    /// Deletes all records in this set.
    delete(): void;
}

export interface SchemaNormalizer {
    normalize: (data: any, context: NormalizeContext) => string[];
}

export interface ModelTypes {
    TableSchemaModel: new (db: DatabaseSchema, name: string, schema: TableDefinition) => TableSchema;
    FieldSchemaModel: new (table: TableSchema, name: string, schema: FieldDefinition) => FieldSchema;
    TableModel: new (session: Session, schema: TableSchema, state: TableState) => Table;
    RecordModel: new (id: string, table: Table) => TableRecord;
    RecordFieldModel: new (schema: FieldSchema, record: TableRecord) => TableRecordField;
    RecordSetModel: new (table: Table, schema: FieldSchema, owner: RecordEntity) => TableRecordSet;
    SchemaNormalizer: new (schema: TableSchema) => SchemaNormalizer;
    Session: new (db: DatabaseSchema, state: DatabaseState, options?: SessionOptions) => Session;
}

export interface ModelFactory {
    newSchemaNormalizer: (schema: TableSchema) => SchemaNormalizer;
    newSession: (db: DatabaseSchema, state: DatabaseState, options?: SessionOptions) => Session;
    newTableSchema: (db: DatabaseSchema, name: string, schema: TableDefinition) => TableSchema;
    newFieldSchema: (table: TableSchema, name: string, schema: FieldDefinition) => FieldSchema;
    newTableModel: (session: Session, schema: TableSchema, state: TableState) => Table;
    newRecordSetModel: (table: Table, schema: FieldSchema, owner: RecordEntity) => TableRecordSet;
    newRecordFieldModel: (schema: FieldSchema, record: TableRecord) => TableRecordField;
}

export interface RecordFactory {
    newRecordModel: (id: string, table: Table) => TableRecord;
}

/**
 * Defines a database schema
 */
export interface Schema {
    [key: string]: TableDefinition;
}

/**
 * Defines a table schema
 */
export interface TableDefinition {
    [key: string]: FieldDefinition;
}

/// Defines a field (column) schema
export interface FieldDefinition {
    /**
     * The field type (Deprecated)
     *
     * @type {FieldType}
     * @memberof FieldDefinition
     * @deprecated
     */
    type?: FieldType;

    /// Declares field to be a primary key.
    pk?: boolean;

    /// Declares field to be used as modified marker
    stamp?: boolean;

    /**
     * The name this field references´ in the model. Defaults to schema key.
     *
     * @type {string}
     * @memberof FieldDefinition
     */
    fieldName?: string;

    /// The property name this field will have on the record model. Defaults to schema key.
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

    /// Defines a custom value factory for the field.
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
    output: MapOf<TableState>;
    emits: { [key: string]: any[] };
    normalizePKs: boolean;

    /// Emits data for further normalization
    emit(tableName: string, record: any): void;
}

/// Represents the schema instance for a database.
export interface DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    factory: ModelFactory & RecordFactory;

    getRecordNormalizer: (schemaName: string) => RecordNormalizer | undefined;
    getPkGenerator: (schemaName: string) => PkGenerator | undefined;
    getRecordComparer: (schemaName: string) => RecordComparer | undefined;
    getRecordMerger: (schemaName: string) => RecordMerger | undefined;
}

/// Represents the available options for creating a new database.
export interface DatabaseOptions {
    /* Register a callback to do custom normalization of data before insert/update ops. */
    onNormalize?: MapOf<RecordNormalizer> | RecordNormalizer;
    onGeneratePK?: MapOf<PkGenerator> | PkGenerator;
    onRecordCompare?: MapOf<RecordComparer> | RecordComparer;
    onRecordMerge?: MapOf<RecordMerger> | RecordMerger;

    cascadeAsDefault?: boolean;
    strict?: boolean;
}

export interface DatabaseCreateOptions extends DatabaseOptions {
    factory?: Partial<ModelFactory>;
    recordModelClass?: RecordClass;
}

/// Represents the available options for creating a new session.
export interface SessionOptions {
    readOnly?: boolean;
    tableSchemas?: TableSchema[];
}

/// Represents the state structure for a database.
export type DatabaseState = MapOf<TableState>;

/// Represents a map of tables. Keyed by name.
export type TableMap = MapOf<Table>;

/// Represents the state structure for a table.
export interface TableState<T = any> {
    name?: string;
    byId: MapOf<T>;
    ids: string[];
    indexes: MapOf<TableIndex>;
}

/// Represents an index structure for a referenced key.
export interface TableIndex {
    unique: boolean;
    values: MapOf<string[]>;
}

/// Represents a session
export interface Session {
    db: DatabaseSchema;
    state: DatabaseState;
    tables: TableMap;
    readOnly: boolean;

    upsert(ctx: NormalizeContext): void;
    commit(): DatabaseState;
}

export interface RecordClass {
    new(id: string, table: Table): TableRecord;
}

export interface ExtendedRecord extends TableRecord {
    _fields: { [key: string]: any };
}
