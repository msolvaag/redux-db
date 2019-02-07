export const timer = (start?: any): any => {
    if (!start) return process.hrtime();
    const end = process.hrtime(start);
    return Math.round((end[0] * 1000) + (end[1] / 1000000));
};

export const median = (numbers: number[]) => {
    const sorted = numbers.slice().sort();
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0)
        return (sorted[middle - 1] + sorted[middle]) / 2;

    return sorted[middle];
};
