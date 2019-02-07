// tslint:disable:no-console
import { max, min, range, sum } from "lodash";
import * as ReduxDB from "./redux-db";
import * as ReduxOrm from "./redux-orm";
import * as utils from "./utils";

const NUM_POSTS = 10000;
const NUM_SAMPLES = 1000;

const posts = range(0, NUM_POSTS).map(id => ({ id, body: "data" }));
const samples: number[] = [];

type Session = (state?: object) => object;

export const run = (name: string, runSample: Session) => {
    let state = runSample();

    console.log("----------------------");
    console.log(name);
    console.log("----------------------");
    console.log(`running ${NUM_SAMPLES} samples with ${NUM_POSTS} upserts`);

    range(0, NUM_SAMPLES).forEach(() => {
        const tstart = utils.timer();
        state = runSample(state);
        const elapsed = utils.timer(tstart);

        samples.push(elapsed);
    });

    const average = sum(samples) / samples.length;
    const median = utils.median(samples);
    const peak = max(samples);
    const low = min(samples);

    console.log("average: " + average);
    console.log("median: " + median);
    console.log("peak: " + peak);
    console.log("low: " + low);
    console.log("");
};

run("ReduxDB 1.1.0", (state?: object) =>
    ReduxDB.session(({ BlogPost }) => BlogPost.upsert(posts), state));
run("ReduxORM 0.12.2", (state?: object) =>
    ReduxOrm.session(({ BlogPost }) => posts.forEach(post => BlogPost.upsert(post)), state));
