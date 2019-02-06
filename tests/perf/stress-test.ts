// tslint:disable:no-console
import { range, sum } from "lodash";
import { MapOf, TableState } from "../../dist/cjs";
import { session } from "../schema";
import * as utils from "./utils";

const NUM_POSTS = 10000;
const NUM_SAMPLES = 1000;

const posts = range(0, NUM_POSTS).map(id => ({ id, body: "data" }));
const samples: number[] = [];

let state: MapOf<TableState> = {};
range(0, NUM_SAMPLES).forEach(() => {
    const tstart = utils.timer();
    state = session(({ BlogPost }) => BlogPost.insert(posts), state);
    const elapsed = utils.timer(tstart);

    samples.push(elapsed);
});

const average = sum(samples) / samples.length;
const median = utils.median(samples);

console.log("average insert: " + average);
console.log("insert median: " + median);
