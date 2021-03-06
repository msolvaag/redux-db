import { TableState } from "./types";

export const TYPE_PK = "PK";
export const TYPE_ATTR = "ATTR";
export const TYPE_MODIFIED = "MODIFIED";

export const ALL = "*";

export const RESERVED_PROPERTIES = ["id", "table", "value", "_fields", "delete", "update"];
export const initialState = <T = any>(name?: string) =>
    ({ ids: [], byId: {}, indexes: {}, meta: {}, name }) as TableState<T>;
