// tslint:disable:max-line-length

export default {
    fkUndefined: (table: string, key: string) => `No foreign key named: ${key} in the schema: "${table}".`
};
