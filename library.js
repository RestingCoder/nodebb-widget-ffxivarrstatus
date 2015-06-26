(function(module) {
	"use strict";

	var async = require('async'),
		fs = require('fs'),
		path = require('path'),
		http = require('http'),
		templates = module.parent.require('templates.js'),
		app;


	var Widget = {
		templates: {}
	};

	Widget.init = function(params, callback) {
		app = params.app;

		var templatesToLoad = [
			"widget.tpl",
			"arrstatus.tpl"
		];

		function loadTemplate(template, next) {
			fs.readFile(path.resolve(__dirname, './public/templates/' + template), function (err, data) {
				if (err) {
					console.log(err.message);
					return next(err);
				}
				Widget.templates[template] = data.toString();
				next(null);
			});
		}

		async.each(templatesToLoad, loadTemplate);

		callback();
	};

	Widget.renderAarstatusWidget = function(widget, callback) {
		var pre = ""+fs.readFileSync("./public/templates/arrstatus.tpl");
		var rep = {};


		function getJson(w) {
			var url = 'http://arrstatus.com/home/getWorldStatus';
			var serverName = w.data.server;

			http.get(url, function(res) {
				var body = '';

				res.on('data', function(chunk) {
					body += chunk;
				});

				res.on('end', function() {
					var parsed = JSON.parse(body);
					var formatted = '';
					var serverStatus = parsed[serverName];
					var lastChecked = 'Last Checked: ' + parsed.Timestamp;

					if (serverStatus != 1) {
						switch(serverStatus){
							case 0:
								formatted = '<p class="arrstatus-server-status arrstatus-offline">Offline (0)</p>';
								break;
							case 2:
								formatted = '<p class="arrstatus-server-status arrstatus-offline">Offline (2)</p>';
								break;
							case 3:
								formatted = '<p class="arrstatus-server-status arrstatus-offline">Maintenance</p>';
								break;
							default:
								formatted = '<p class="arrstatus-server-status arrstatus-offline">Offline (*)</p>';
						}
					} else {
						formatted = '<p class="arrstatus-server-status arrstatus-online">Online</p>';
					}

					rep = {
						"arrstatus-server-name": serverName,
						"arrstatus-server-status": formatted,
						"arrstatus-credit": 'Data provided by <a href="http://arrstatus.com/" target="_blank">ARRStatus.com</a>',
					};

					var x;
					for(x in rep){
						if(rep.hasOwnProperty(x)){
							pre = pre.replace(new RegExp("{{"+x+"}}", "g"), rep[x]);
						}
					}

					callback(null, pre);
				});
			}).on('error', function(e) {
				console.log("Got error: ", e);
				callback(null, 'ERROR!');
			});
		}

		getJson(widget);
	};

	Widget.defineWidget = function(widgets, callback) {
		widgets.push({
			widget: "arrstatus",
			name: "FFXIV Server Status",
			description: "Shows the status of your FFXIV server.",
			content: fs.readFileSync(path.resolve(__dirname, './public/templates/widget.tpl')),
		});

		callback(null, widgets);
	};


	module.exports = Widget;
}(module));