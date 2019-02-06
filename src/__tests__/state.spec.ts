import { merge } from "lodash";
import { initialState } from "../constants";
import * as stateUtils from "../state";

describe("merge", () => {

    const original = initialState();
    const modified = initialState();

    const merged = stateUtils.merge(original, modified);

    test("merges the given states", () =>
        expect(merged).toEqual(merge(original, modified)));
});
