var http =require('http');
http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello World\n');
}).listen(8080, '93.104.213.182');
console.log('Server running at 93.104.213.182:8080');