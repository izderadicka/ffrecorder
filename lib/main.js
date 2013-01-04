var panels = require('panel');
var data = require('self').data;
var tabs = require('tabs');
var timer = require('timers');

exports.main = function(options) {
	var menuDefinition = [{
		label : 'Start Recording'
	}, {
		label : 'Apply Changes'
	}, {
		label : 'Cancel Recording'
	}];
	var menu = function() {
		var menu = [];
		for (var i = 0; i < menuDefinition.length; i += 1) {
			menu[i] = {
				label : menuDefinition[i].label,
				enabled : false
			};
		}

		switch (recorder.status) {
			case 'idle': {
				menu[0].enabled = true;
				break;
			}
			case 'recording': {
				menu[1].enabled = true;
				menu[2].enabled = true;
				break
			}
			case 'replay' : {
				menu[1].label = 'Application Progress';
				menu[1].enabled = true;
				menu[2].enabled = true;
			}

		}
		return menu
	};

	var panel = panels.Panel({
		width : 250,
		height : 200,
		contentURL : data.url('menuPanel.html'),
		contentScriptFile : [data.url('jquery-1.8.3.min.js'), data.url('menuPanel.js')],
		onShow : function() {
			panel.postMessage(menu())
		}
	});

	panel.port.on('selected', function(selection) {
		console.debug('Selected ' + selection);
		switch (selection) {
			case 0: {
				recorder.record();
				break
			}
			case 1: {
				if (recorder.status === 'replay') {
					replayPanel.show()
				} else {
					recorder.replayStart()
				}
				break
			}
			case 2: {
				recorder.cancel()
				break
			}
		}
		panel.hide();
	});

	var replayPanel = panels.Panel({
		width : 300,
		height : 150,
		contentURL : data.url('replayPanel.html'),
		contentScriptFile : [data.url('jquery-1.8.3.min.js'), data.url('replayPanel.js')],
	});

	var widget = require("widget").Widget({
		id : "ffrecord",
		label : "ffrecorder plugin",
		contentURL : data.url('rec-inactive.png'),
		panel : panel
	});
	widget.active = function() {
		this.contentURL = data.url('rec-active.png');
	};
	widget.inactive = function() {
		this.contentURL = data.url('rec-inactive.png');
	};

	var recorder = (function() {
		var worker, changes = [], initialData, usedTab;
		var sendChange = function() {
			var change = changes.shift();
			worker.port.emit('apply_change', change);
			replayPanel.port.emit('count', changes.length)
		};
		var onReload = function() {
			if (recorder.status === 'replay') {
				console.debug('Reloaded for next change');
				recorder.replayNext()

			} else if (recorder.status !== "idle") {
				recorder.cancel(true)
			} else {
				widget.inactive()
			}
		};

		var delegate = {
			status : 'idle',
			record : function record(root) {
				delegate.status = 'working';
				usedTab=tabs.activeTab;
				usedTab.on('ready', onReload);
				widget.active();
				worker = usedTab.attach({
					contentScriptFile : [data.url('jquery-1.8.3.min.js'), data.url('recorder.js')]
				});
				worker.port.on('ready', function(data) {
					console.debug('Recorder is ready ');
					initialData = data;
					delegate.status = 'recording';
				});
				worker.port.on('change', function(change) {
					console.debug('change ' + change.toSource());
					changes.push(change);
				});
				worker.port.emit('start', root)
			},
			cancel : function(noRestore) {
				delegate.status = 'working';
				if (usedTab) {
					usedTab.removeListener('ready', onReload);
					usedTab=null;
				}
				if (worker) {
					if (!noRestore) {
						worker.port.emit('restore');
					}
					worker.destroy();
					worker = null;
				}
				changes = [];
				initialData = null;
				delegate.status = 'idle';
				widget.inactive();
			},
			replayStart : function() {

				delegate.status = 'replay';
				replayPanel.show();
				replayPanel.port.emit('init', changes.length)
				if (changes.length) {
					var oldValues = {};
					for (var i = 0; i < changes.length; i += 1) {
						var inputId = changes[i].id;
						oldValues[inputId] = initialData[inputId]
					}
					worker.port.emit('prepare_replay', oldValues);
					worker.port.on('replay_ready', function() {
						sendChange();
					})
				} else {
					delegate.cancel()
				}
			},
			replayNext : function() {
				worker = usedTab.attach({
					contentScriptFile : [data.url('jquery-1.8.3.min.js'), data.url('applyChange.js')]
				});
				if (changes.length) {
					timer.setTimeout(sendChange, 2000);
				} else {
					replayPanel.port.emit('done');
					delegate.cancel(true)
				}

			}
		}
		return delegate
	})();
}