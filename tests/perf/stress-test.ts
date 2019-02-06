// tslint:disable:no-console
import { range, sum } from "lodash";
import { session } from "../schema";
import * as utils from "./utils";

const NUM_POSTS = 1000;
const NUM_SAMPLES = 100;

const posts = range(0, NUM_POSTS).map(id => ({ id, body: "data" }));
const samples: number[] = [];

range(0, NUM_SAMPLES).forEach(() => {
    const tstart = utils.timer();
    session(({ BlogPost }) => BlogPost.insert(posts));
    const elapsed = utils.timer(tstart);

    samples.push(elapsed);
});

const average = sum(samples) / samples.length;
const median = utils.median(samples);

console.log("average insert: " + average);
console.log("insert median: " + median);
