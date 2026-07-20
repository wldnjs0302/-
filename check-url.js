import http from 'http';

http.get('http://localhost:3000/choijiwon/1.png', (res) => {
  console.log(`choijiwon statusCode: ${res.statusCode}`);
});

http.get('http://localhost:3000/최지원/1.png', (res) => {
  console.log(`최지원 statusCode: ${res.statusCode}`);
});

http.get('http://localhost:3000/%E1%84%8E%E1%85%AC%E1%84%8C%E1%85%B5%E1%84%8B%E1%85%AF%E1%86%AB/1.png', (res) => {
  console.log(`NFD statusCode: ${res.statusCode}`);
});
