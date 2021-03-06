// tslint:disable:max-line-length

export default {
    argument: (name: string, type: string) => `Missing a valid ${type} for the argument "${name}"`,
    argumentShape: (name: string, props: string[]) => `Argument "${name}" has an invalid shape. Missing required props: "${props.join(", ")}"`,
    fkInvalid: (table: string, key: string) => `The foreign key ${table}.${key} is invalid`,
    fkInvalidReference: (table: string, key: string, reference: string) => `The field schema "${table}.${key}" has an invalid reference to unknown table "${reference}".`,
    fkReferenceNotInSession: (key: string, references?: string) => `The foreign key: "${key}" references an unregistered table: "${references}" in the current session.`,
    fkUndefined: (table: string, key: string) => `No foreign key named: ${key} in the schema: "${table}".`,
    fkViolation: (table: string, key: string) => `The insert/update operation violates the unique foreign key "${table}.${key}".`,
    invalidId: () => 'The given value is not a valid "id". An "id" must be a non-empty string or a number.',
    normalizeInvalidData: () => "Failed to normalize data. Given argument is not a plain object nor an array.",
    normalizeInvalidFk: (table: string, key: string, refTable: string) => `Invalid schema definition. The field "${table}.${key}" is referencing table "${refTable}", but the given data is an array.`,
    normalizePk: (name: string) => `Failed to normalize primary key for record of type "${name}". Make sure record(s) have a primary key value before trying to insert or update a table.`,
    normalizeFkViolation: (table: string, key: string) => `The insert/update operation violates the unique foreign key "${table}.${key}".`,
    pkNotFound: (table: string) => `Failed to get primary key for record of type "${table}".`,
    recordNotFound: (table: string, id: string | number) => `No "${table}" record with id: ${id} exists.`,
    recordUpdateViolation: (table: string, id: string) => `Failed to apply update. No "${table}" record with id: ${id} exists.`,
    reservedProperty: (name: string, prop: string) => `The property "${name}.${prop}" is a reserved name. Please specify another name using the "propName" definition.`,
    sessionReadonly: () => "Invalid attempt to alter a readonly session.",
    stateTableUndefined: () => "Failed to select table. Could not identify table schema.",
    tableInvalidState: (table: string) => `The table "${table}" has an invalid state.`,
    tableNotInSession: (table: string) => `The table: "${table}" does not exist in the current session.`,
    uniqueConstraintViolation: (id: string) => `Operation violates unique constraint for id: "${id}"`,
    unknownTableState: () => "Failed to identifiy table state."
};
