self.on('message', function(items){
	
	var list=$('ul.selector');
	list.empty();
	for (var i=0;i<items.length;i+=1) {
		var item=$('<li class="'+(items[i].enabled?'enabled':'disabled')+'">'+items[i].label+'</li>')
		  .appendTo(list)
		  .data("id", i);
		 if (items[i].enabled) {
		  item.click(function(){
			self.port.emit('selected', $(this).data('id'));
		})
		}
	}
	
})
