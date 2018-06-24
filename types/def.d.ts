export declare type FieldType = "ATTR" | "MODIFIED" | "PK";
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
export declare type RecordValue = Record<string, any>;
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
export interface TableRecord<T extends RecordValue = RecordValue> {
    id: string;
    table: Table<T>;
    value: T;
    update(data: Partial<T>): TableRecord<T>;
    delete(): void;
}
export interface TableRecordSet<R extends TableRecord<T> = any, T = any> {
    value: T[];
    ids: string[];
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
    newTableModel(session: Session, schema: TableSchema, state: TableState): Table;
    newTableSchema(db: DatabaseSchema, name: string, schema: TableDDL): TableSchema;
    newRecordModel(id: string, table: Table): TableRecord;
}
export interface SchemaDDL {
    [key: string]: TableDDL;
}
export interface TableDDL {
    [key: string]: FieldDDL;
}
export interface FieldDDL {
    type?: FieldType;
    propName?: string;
    references?: string;
    relationName?: string;
    cascade?: boolean;
    unique?: boolean;
    notNull?: boolean;
    value?: (record: any, context?: ComputeContext<any>) => any;
}
export interface ComputeContext<T> {
    schema: FieldSchema;
    record?: TableRecord<T>;
}
export interface NormalizeContext {
    schema: TableSchema;
    db: DatabaseSchema;
    output: NormalizedState;
    emits: {
        [key: string]: any[];
    };
    normalizePKs: boolean;
    emit(tableName: string, record: any): void;
}
export interface Normalizer {
    (record: any, context: NormalizeContext): any;
}
export interface MissingKeyHook {
    (record: any, schema: TableSchema): string | null | undefined;
}
export interface DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks?: {
        [key: string]: Normalizer;
    };
    onMissingPk?: MissingKeyHook;
    factory: ModelFactory;
}
export interface DatabaseOptions {
    onNormalize?: {
        [key: string]: Normalizer;
    };
    onMissingPk?: MissingKeyHook;
    cascadeAsDefault?: boolean;
    factory?: ModelFactory;
}
export interface SessionOptions {
    readOnly: boolean;
}
export interface DatabaseState {
    [key: string]: TableState;
}
export interface TableState<T = any> {
    name?: string;
    byId: {
        [key: string]: T;
    };
    ids: string[];
    indexes: TableIndex;
}
export interface TableIndex {
    [key: string]: {
        unique: boolean;
        values: {
            [key: string]: string[];
        };
    };
}
export interface TableMap {
    [key: string]: Table;
}
export interface Session {
    db: DatabaseSchema;
    state: DatabaseState;
    tables: TableMap;
    upsert(ctx: NormalizeContext): void;
    commit(): DatabaseState;
}
export interface NormalizedState {
    [key: string]: {
        ids: string[];
        byId: {
            [key: string]: any;
        };
        indexes: TableIndex;
    };
}
export interface Reducer {
    (session: any, action: any, arg?: any): void;
}
