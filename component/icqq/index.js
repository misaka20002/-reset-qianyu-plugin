let icqq;
try {
    icqq = await import("icqq");
} catch (err) {
    icqq = await import("oicq");
}
let segment = icqq.segment;
export { segment }

