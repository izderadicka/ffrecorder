items=$('input[id*="xxEDPrcnt"]')
items.each(function() {var that=$(this);  var x=parseInt(that.val()); if (x) { that.val(x+Math.round(Math.random()*5-10));that.change()}})
