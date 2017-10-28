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
export interface Table<R extends TableRecord<T> = TableRecord, T = Record<string, any>> {
    session: Session;
    schema: TableSchema;
    state: TableState;
    dirty: boolean;
    get(id: string | number): R;
    getOrDefault(id: string | number): R | null;
    getByFk(fieldName: string, id: string | number): TableRecordSet<R, T>;
    all(): R[];
    filter(callback: (record: R) => boolean): R[];
    exists(id: string | number): boolean;
    index(name: string, fk: string): string[];
    value(id: string | number): T;
    getFieldValue<F extends keyof T>(id: string | number, field: F): T[F] | undefined;
    insert(data: T | T[]): R;
    insertMany(data: T | T[]): R[];
    update(data: Partial<T> | Partial<T>[]): R;
    updateMany(data: Partial<T> | Partial<T>[]): R[];
    upsert(data: Partial<T> | Partial<T>[]): R;
    delete(id: string | number): boolean;
    deleteAll(): void;
    upsertNormalized(table: TableState<T>): void;
}
export interface TableRecord<T = any> {
    id: string;
    table: Table;
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
    newTableModel(session: Session, state: TableState, schema: TableSchema): Table;
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
    value?: <T, V>(record: T, context?: ComputeContext<T>) => V;
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
    emit(tableName: string, record: any): void;
}
export interface Normalizer {
    (record: any, context: NormalizeContext): any;
}
export interface DatabaseSchema {
    tables: TableSchema[];
    options: DatabaseOptions;
    normalizeHooks?: {
        [key: string]: Normalizer;
    };
    factory: ModelFactory;
}
export interface DatabaseOptions {
    onNormalize?: {
        [key: string]: Normalizer;
    };
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
