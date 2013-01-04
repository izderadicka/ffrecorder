var totalChanges;

var updateProgress=function(count) {
	var pct=Math.round(100*(totalChanges-count)/totalChanges);
	$('div#bar').css('width',pct+'%' )
}

self.port.on('init', function (total) {
	//console.debug('Total changes '+total);
	totalChanges=total;
	$('#count').html(total);
	$('#total').html(total);
	$('#done').hide();
	$('#warn').show();
	updateProgress(total)
});

self.port.on('count', function (count) {
	$('#count').html(count);
	updateProgress(count);
});

self.port.on('done', function(){
	$('#done').show();
	$('#warn').hide();
})
