import Database from "./models/Database";
/**
 * Creates a database instance with given schema.
 *
 * @param {Schema} schema
 * @param {DatabaseOptions} [options]
 */
export var createDatabase = function (schema, options) { return new Database(schema, options); };
export * from "./constants";
export * from "./DefaultModelFactory";
import * as utils from "./utils";
export { utils };
