var recorderPlugin = {
inputs: $('form').find('input[id]'),	
initialHandlers:{},
restoreHandlers:function() {
	recorderPlugin.inputs.each(function() {
		var that=$(this)
		this.onchange=null;
		if (recorderPlugin.initialHandlers.hasOwnProperty(that.attr('id'))) {
			this.onchange=recorderPlugin.initialHandlers[that.attr('id')]
		}
	})
},
escapeSelector:function(sel) {
	return sel.replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]\^`{|}~]/g, '\\$&')
}
};

self.port.on('start', function(){
	console.debug('Recording Init');
	var initialValues={};
	    
	    
	recorderPlugin.inputs.each(function() {
		var item= $(this);
		initialValues[item.attr('id')]=item.val();
		recorderPlugin.initialHandlers[item.attr('id')]=this.onchange;
		this.onchange=function(val) {
			that=$(this);
			self.port.emit('change', {id:that.attr('id'), val:that.val()})
		}
	});
	
	self.port.emit('ready', initialValues);
	
});

self.port.on('restore', function () {
	recorderPlugin.restoreHandlers();
	
});

self.port.on('prepare_replay', function (oldValues) {
	recorderPlugin.inputs.each(function(){
		this.onchange=null;
	});
	for (key in oldValues) {
		if (oldValues.hasOwnProperty(key)) {
			$('input#'+recorderPlugin.escapeSelector(key)).val(oldValues[key])
		}
	}
	recorderPlugin.restoreHandlers();
	self.port.emit('replay_ready');
});

self.port.on('apply_change', function(change){
	$('input#'+recorderPlugin.escapeSelector(change.id)).val(change.val).change();
})
