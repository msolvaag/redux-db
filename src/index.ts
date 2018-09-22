import Database from "./Database";
import {
    DatabaseOptions,
    Schema
} from "./types";

export const createDatabase = (schema: Schema, options?: DatabaseOptions) => new Database(schema, options);

export * from "./constants";
export * from "./models";
export * from "./DefaultModelFactory";
export * from "./types";
