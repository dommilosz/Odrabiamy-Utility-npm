
const secrets = require("./secrets.json"); // read the creds
const webserver = require("./webserver.js"); // to serve the webserver
const opn = require("opn"); //to open a browser window
const config = require("./config.json"); // read the config

webserver.createServer(config.ports.web); // create the webserver
webserver.password = config.password;
webserver.onstart(() => {
	// set up actions for the webserver
	startQueuing();
});
webserver.onstop(() => {
	stop();
});

if (config.openBrowserOnStart) {
	opn("http://localhost:" + config.ports.web); //open a browser window
}

var StartArgs = process.argv.slice(2);
console.log("StartArgs: ", StartArgs);

