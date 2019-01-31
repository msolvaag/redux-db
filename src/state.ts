import errors from "./errors";
import { ForeignKey, MapOf, TableIndex, TableState } from "./types";
import { mergeIds } from "./utils";

export const merge = (original: TableState, modified: Partial<TableState>) => {
    const ids = modified.ids
        ? mergeIds(original.ids, modified.ids, true)
        : original.ids;

    const byId = modified.byId
        ? { ...original.byId, ...modified.byId }
        : original.byId;

    const meta = modified.meta
        ? { ...original.meta, ...modified.meta }
        : original.meta;

    return {
        ...original,
        byId,
        ids,
        meta
    };
};

export const splice = (original: TableState, idsToDelete: string[]) => {
    const byId = { ...original.byId };
    const ids = original.ids.slice();
    const indexes = { ...original.indexes };
    const meta = { ...original.meta };

    const deleted = idsToDelete.reduce((n, id) => {
        const record = byId[id];
        delete byId[id];
        delete meta[id];

        const idx = ids.indexOf(id);
        if (idx >= 0)
            ids.splice(idx, 1);

        if (record)
            return [...n, { id, record }];

        return n;
    }, [] as { id: string, record: any }[]);

    return {
        deleted,
        state: { ...original, byId, ids, indexes, meta }
    };
};

export const updateIndexes = (name: string, original: TableState, modified: TableState) => {
    Object.keys(modified.indexes).forEach(key => {
        const idx = original.indexes[key]
            || (original.indexes[key] = { unique: modified.indexes[key].unique, values: {} });

        Object.keys(modified.indexes[key].values).forEach(fk => {
            const idxBucket = idx.values[fk] || (idx.values[fk] = []);

            const modifiedBucket = mergeIds(idxBucket, modified.indexes[key].values[fk], false);

            if (idx.unique && modifiedBucket.length > 1)
                throw new Error(errors.fkViolation(name, key));

            idx.values[fk] = modifiedBucket;
        });
    });
};

export const cleanIndexes = (keys: ForeignKey[], id: string, indexes: MapOf<TableIndex>) => {
    keys.forEach(fk => {
        let fkIdx = -1;
        if (fk.value && indexes[fk.name] && indexes[fk.name].values[fk.value])
            fkIdx = indexes[fk.name].values[fk.value].indexOf(id);

        if (fkIdx >= 0) {
            const idxBucket = indexes[fk.name].values[fk.value].slice();
            idxBucket.splice(fkIdx, 1);

            indexes[fk.name].values[fk.value] = idxBucket;
        } else if (indexes[fk.name]) {
            delete indexes[fk.name].values[id];
            if (Object.keys(indexes[fk.name].values).length === 0)
                delete indexes[fk.name];
        }
    });
};

export default {
    cleanIndexes,
    merge,
    splice,
    updateIndexes
};
