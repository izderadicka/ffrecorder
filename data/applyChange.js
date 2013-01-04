var escapeSelector=function(sel) {
	return sel.replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]\^`{|}~]/g, '\\$&');
};

self.port.on('apply_change', function(change){
	var item=$('input#'+escapeSelector(change.id));
	var retries=3;
	var tryChange=function() {
		try {
			item.val(change.val).change();
		} catch (error) {
			console.error("change error "+error.toSource())
			console.exception();
			if (retries>0) {
				window.setTimeout(tryChange, 1000)
			} else {
				console.error("Cannot initiate change due to exceptions")
			}
			retries-=1;
		}
	}
	
	window.setTimeout(tryChange, 10)
})