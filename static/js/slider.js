function slider_returnToNormal(element) {
	$(element)
		.toggleClass("selected")
		.animate({ width: $("#mapslider").data("regWidth")})
		.find("img")
		.animate({ width: $("#mapslider").data("regImgWidth") })
	    .end()
		.find("h2")
		.animate({ fontSize: $("#mapslider").data("regTitleSize") })
		.end()
		.find("p")
		.animate({ fontSize: $("#mapslider").data("regParSize") });
};

function slider_growBigger(element) {
	$(element)
		.toggleClass("selected")
		.animate({ width: $("#mapslider").data("curWidth")})
		.find("img")
		.animate({ width: $("#mapslider").data("curImgWidth") })
	    .end()
		.find("h2")
		.animate({ fontSize: $("#mapslider").data("curTitleSize") })
		.end()
		.find("p")
		.animate({ fontSize: $("#mapslider").data("curParSize") });
}

//direction true = right, false = left
function slider_change(direction) {
   
    //if not at the first or last panel
	var curPanel = $("#mapslider").data("curPanel");
	var totalPanels = $("#mapslider").data("totalPanels");
	var movingDistance = $("#mapslider").data("movingDistance");
	if((direction && !(curPanel < totalPanels)) || (!direction && (curPanel <= 1))) { return false; }	
    
    //if not currently moving
    if (($("#mapslider").data("currentlyMoving") == false)) {
        
		$("#mapslider").data("currentlyMoving", true);
		
		var next         = direction ? curPanel + 1 : curPanel - 1;
		var leftValue    = $("#mapslider .scrollContainer").css("left");
		var movement	 = direction ? parseFloat(leftValue, 10) - movingDistance : parseFloat(leftValue, 10) + movingDistance;
	
		$("#mapslider .scrollContainer")
			.stop()
			.animate({
				"left": movement
			}, function() {
				$("#mapslider").data("currentlyMoving", false);
			});
		slider_returnToNormal("#panel_"+curPanel);
		slider_growBigger("#panel_"+next);
		
		
		curPanel = next;
		$("#mapslider").data("curPanel", curPanel);
		
		//remove all previous bound functions
		$("#panel_"+(curPanel+1)).unbind();	
		
		//go forward
		$("#panel_"+(curPanel+1)).click(function(){ slider_change(true); });
		
        //remove all previous bound functions															
		$("#panel_"+(curPanel-1)).unbind();
		
		//go back
		$("#panel_"+(curPanel-1)).click(function(){ slider_change(false); }); 
		
		//remove all previous bound functions
		$("#panel_"+curPanel).unbind();
	}
}

$(document).ready(function(){
	$("#mapslider").data("totalPanels", $("#mapslider .scrollContainer").children().size());
	
	$("#mapslider").data("regWidth", $("#mapslider .mappanel").css("width"));
	$("#mapslider").data("regImgWidth", $("#mapslider .mappanel img").css("width"));
	$("#mapslider").data("regTitleSize", $("#mapslider .mappanel h2").css("font-size"));
	$("#mapslider").data("regParSize", $("#mapslider .mappanel p").css("font-size"));
	
	$("#mapslider").data("curWidth", 350);
	$("#mapslider").data("curImgWidth", 326);
	$("#mapslider").data("curTitleSize", "20px");
	$("#mapslider").data("curParSize", "15px");
	
	$("#mapslider").data("movingDistance", 300);
	
	var $panels				= $('#mapslider .scrollContainer > div');
	var $container			= $('#mapslider .scrollContainer');

	$panels.css({'float' : 'left','position' : 'relative'});

	$("#mapslider").data("currentlyMoving", false);

	$container
		.css('width', ($panels[0].offsetWidth * $panels.length) + 100 )
		.css('left', $("#mapslider").data("curWidth") * 0.5);

	var scroll = $('#mapslider .scroll').css('overflow', 'hidden');
		
	
	// Set up "Current" panel and next and prev
	slider_growBigger("#panel_1");	
	var curPanel = 1;
	$("#mapslider").data("curPanel", curPanel);
	$("#panel_"+(curPanel+1)).click(function(){ slider_change(true); });
	$("#panel_"+(curPanel-1)).click(function(){ slider_change(false); });
	
	//when the left/right arrows are clicked
	$("#mapslider .right").click(function(){ slider_change(true); });	
	$("#mapslider .left").click(function(){ slider_change(false); });
	
	$(window).keydown(function(event){
	  switch (event.keyCode) {
			case 13: //enter
				$("#mapslider .right").click();
				break;
			case 32: //space
				$("#mapslider .right").click();
				break;
	    case 37: //left arrow
				$("#mapslider .left").click();
				break;
			case 39: //right arrow
				$("#mapslider .right").click();
				break;
	  }
	});
	
});