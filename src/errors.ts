// tslint:disable:max-line-length

export default {
    fkInvalidReference: (key: string) => `The foreign key: "${key}" does not define a valid referenced table.`,
    fkReferenceNotInSession: (key: string, references: string) => `The foreign key: "${key}" references an unregistered table: "${references}" in the current session.`,
    fkUndefined: (table: string, key: string) => `No foreign key named: ${key} in the schema: "${table}".`,
    fkViolation: (table: string, key: string) => `The insert/update operation violates the unique foreign key "${table}.${key}".`,
    recordNotFound: (table: string, id: string | number) => `No "${table}" record with id: ${id} exists.`,
    recordUpdateNotFound: (table: string, id: string) => `Failed to apply update. No \"${table}\" record with id: ${id} exists.`,
    reservedProperty: (name: string, prop: string) => `The property "${name}.${prop}" is a reserved name. Please specify another name using the "propName" definition.`,
    sessionReadonly: () => "Invalid attempt to alter a readonly session.",
    stateTableUndefined: () => "Failed to select table. Could not identify table schema.",
    tableInvalidState: (table: string) => `The table "${table}" has an invalid state.`,
    tableNotInSession: (table: string) => `The table: "${table}" does not exist in the current session.`
};
