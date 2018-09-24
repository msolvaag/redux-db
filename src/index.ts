import Database from "./models/Database";
import {
    DatabaseOptions,
    Schema
} from "./types";

export const createDatabase = (schema: Schema, options?: DatabaseOptions) => new Database(schema, options);

export * from "./constants";
export * from "./models";
export * from "./DefaultModelFactory";
export * from "./types";

import * as utils from "./utils";
export { utils };
