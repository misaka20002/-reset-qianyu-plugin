import RandExp from "randexp";
const randexp = new RandExp(/[a-z]{6}/);
console.log(randexp.gen());
