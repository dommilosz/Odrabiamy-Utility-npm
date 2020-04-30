//this module exposes functions and variables to control the HTTP server.
const http = require("http"); //to serve the pages
const fs = require("fs"); //to read the webpages from disk
const secrets = require("./secrets.json"); // read the creds
const config = require("./config.json"); // read the config
const odrabiamy = require("./odrabiamy-pl");
module.exports = {
	createServer: (port) => {
		http.createServer((req, res) => {
			hash = "";
			url = req.url;
			classid = "";
			exurl = "";
			parmarr = req.url.split("?");
			url = parmarr[0];
			expageid = "";
			pageid = "";
			subject = "";
			parmarr = parmarr.slice(1, parmarr.length);
			parmarr.forEach((element) => {
				if (element.includes("hash=")) {
					hash = element.replace("hash=", "");
				}
				if (element.includes("url=")) {
					exurl = element.replace("url=", "");
				}
				if (element.includes("class=")) {
					classid = element.replace("class=", "");
				}
				if (element.includes("ex=")) {
					expageid = element.replace("ex=", "");
				}
				if (element.includes("page=")) {
					pageid = element.replace("page=", "");
				}
				if (element.includes("subject=")) {
					subject = element.replace("subject=", "");
				}
			});
			if (req.url.includes("/auth?password=")) {
				//main page of the web app
				pass = req.url.replace("/auth?password=", "");
				if (pass == module.exports.password) {
					r = AddHash(module.exports.hashes);
					res.writeHead(200, { "Content-type": "text/html" });
					res.write(r);
				} else {
					res.writeHead(403, { "Content-type": "text/html" });
					res.write("WRONG PASSWORD");
				}
				res.end();
			} else if (url === "/index.css") {
				//css file to make it not look like too much shit
				res.writeHead(200, { "Content-type": "text/css" });
				res.write(fs.readFileSync("index.css"));
				res.end();
			} else if (
				(req.url.includes("?hash=") &&
					CheckHash(module.exports.hashes, hash)) ||
				CheckHash(module.exports.hashes, req.headers.xpassword)
			) {
				UpdateHash(module.exports.hashes, hash);
				UpdateHash(module.exports.hashes, req.headers.xpassword);
				if (url === "/") {
					res.writeHead(200, { "Content-type": "text/html" });
					res.write(fs.readFileSync("index.html"));
					res.end();
					//main page of the web app
				} else if (url === "/getex") {
					//API endpoint to get position, ETA, and status in JSON format

					var ts = Math.round(new Date().getTime() / 100);
					resp = GetEx(exurl).then((resp) => {
						res.writeHead(200, { "Content-type": "text/json" });
						res.write(resp);
						res.end();
					});
				} else if (url === "/getoptn") {
					//API endpoint to get position, ETA, and status in JSON format

					resp = GetOptn(exurl).then((resp) => {
						res.writeHead(200, { "Content-type": "text/json" });
						json = JSON.stringify(resp);
						res.write(json);
						res.end();
					});
				} else if (url === "/getbooks") {
					//API endpoint to get position, ETA, and status in JSON format

					var ts = Math.round(new Date().getTime() / 100);
					GetBooks(subject).then((resp) => {
						res.writeHead(200, { "Content-type": "text/json" });
						json = JSON.stringify(resp);
						res.write(json);
						res.end();
					});
				} else if (url === "/getexercises") {
					//API endpoint to get position, ETA, and status in JSON format

					var ts = Math.round(new Date().getTime() / 100);
					GetExercises(exurl, pageid).then((resp) => {
						res.writeHead(200, { "Content-type": "text/json" });
						json = JSON.stringify(resp);
						res.write(json);
						res.end();
					});
				} else if (url === "/getsubjects") {
					//API endpoint to get position, ETA, and status in JSON format

					var ts = Math.round(new Date().getTime() / 100);
					GetSubjects(classid).then((resp) => {
						res.writeHead(200, { "Content-type": "text/json" });
						json = JSON.stringify(resp);
						res.write(json);
						res.end();
					});
				}
			} else {
				res.writeHead(200, { "Content-type": "text/html" });
				res.write(fs.readFileSync("login.html"));
				res.end();
			}
		}).listen(port,"0.0.0.0");
	},
	onstart: (callback) => {
		//function to set the action to do when starting
		module.exports.onstartcallback = callback;
	},
	onstop: (callback) => {
		//same but to stop
		module.exports.onstopcallback = callback;
	},
	onstartcallback: null, //a save of the action to start
	onstopcallback: null, //same but to stop
	password: "", //the password to use for the webapp
	hashes: {
		validhashes: [],
		lastupdated: [],
	},
};
function AddHash(hashes_arr) {
	var ts = Math.round(new Date().getTime() / 1000);
	r1 = Math.random().toString(36).substring(7);
	r2 = Math.random().toString(36).substring(7);
	r3 = Math.random().toString(36).substring(7);
	r4 = Math.random().toString(36).substring(7);
	r = r1 + r2 + r3 + r4;
	console.log("hash : ", r);

	module.exports.hashes.validhashes.push(r);
	module.exports.hashes.lastupdated.push(ts);
	return r;
}
function CheckHash(hashes_arr, hash) {
	var ts = Math.round(new Date().getTime() / 1000);
	if (hashes_arr.validhashes.includes(hash)) {
		i = hashes_arr.validhashes.indexOf(hash);
		updated = ts - hashes_arr.lastupdated[i];
		if (updated < 600) {
			return true;
		} else return false;
	} else return false;
}
function UpdateHash(hashes_arr, hash) {
	var ts = Math.round(new Date().getTime() / 1000);
	if (CheckHash(hashes_arr, hash)) {
		i = hashes_arr.validhashes.indexOf(hash);
		hashes_arr.lastupdated[i] = ts;
	}
}

login = odrabiamy.login(secrets.username, secrets.password);

function GetEx(_url) {
	let result = odrabiamy.GetExercise("https://odrabiamy.pl" + _url);
	return result;
}
function GetOptn(_url) {
	result = odrabiamy.GetOptions(_url);
	return result;
}
function GetExercises(_url, _page) {
	result = odrabiamy.GetExercises(_url + "/" + _page);
	return result;
}
function SanitizeString(_str) {
	if (_str) {
		str2 = _str.split("-")[1];
		return str2;
	}
}
function GetBooks(_subject) {
	resp = odrabiamy.GetBooks(_subject);
	return resp;
}
function GetSubjects(_classid) {
	resp = odrabiamy.GetSubjects(_classid);
	return resp;
}
