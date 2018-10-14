import Database from "./models/Database";
export var createDatabase = function (schema, options) { return new Database(schema, options); };
export * from "./constants";
export * from "./DefaultModelFactory";
import * as utils from "./utils";
export { utils };
