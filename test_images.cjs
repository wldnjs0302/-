async function test() {
  const r1 = await fetch("http://localhost:3000/leeyoonseop/1.png");
  console.log("leeyoonseop:", r1.status);
  const r2 = await fetch("http://localhost:3000/gwangeoreulchajaseo/1.png");
  console.log("gwangeo:", r2.status);
}
test();
