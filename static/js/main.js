var dotpg = null;
var pubmap = null;
var primap = null;
function chat_create_box(title) {
    var html = "<div id='chatbox'>";
    html += "<p id='chat_title' class='panel_title'>"+title+"</p>";
    html += "</div>";
    $("#container").after(html);
    chat_create_box_body();
	$("#chat_title").click(function() {
		if ($("#chatbox").height() > 20) {
			$("#chatbox").css("height", "20px");
    		$("#chat_box_body").hide();
		}
		else {
			$("#chatbox").css("height", "400px");
    		$("#chat_box_body").show();
			$('#chat_title').stop();
			$('#chat_title').css("background-color", "#D1D5DF");
			$('#chat_title').css("opacity", 1);
		}
	});
};

function chat_create_box_body(){
    var html = "<div id='chat_box_body'>";
    html += "<div id='chat_text'></div>";
    html += "<textarea id='chat_type_box'></textarea>";   
    html += "</div>";
    $("#chat_title").after(html);
};

function chat_add_message(from, text) {
	var chatmsg = "<p class='chatmsg'><b>"+from+": </b>"+text+"</p>";
    var chat_text = $("#chat_text");
    chat_text.append(chatmsg);
    chat_text.attr({scrollTop: chat_text.attr("scrollHeight")});
	notify_new_message();
};

function notify_new_message() {
	if ($("#chatbox").height() == 20) {
		$('#chat_title').css("background-color", "yellow");
		$('#chat_title').stop();
		$('#chat_title').pulse({
                opacity: [0,1]
            }, {
                times: 999999    
            });
	}
};

function plangraph_create_box(title) {
	var html = "<div id='pgvis_box'>";
    html += "<p id='pgvis_title' class='panel_title'>"+title+"</p>";
    html += "</div>";
    $("#container").after(html);
    plangraph_create_box_body();
	$("#pgvis_title").click(function() {
		if ($("#pgvis_box").height() > 20) {
			$("#pgvis_box").css("height", "20px");
    		$("#pgvis").hide();
		}
		else {
			$("#pgvis_box").css("height", "478px");
    		$("#pgvis").show();
		}
	});
};

function plangraph_create_box_body(){
    var html = "<div id='pgvis'>";
    html += "</div>";
    $("#pgvis_title").after(html);
};

function initiate_planraph(){
		var pgSettings = {
		iRootOrientation: "top", 
		linkType: "B",
		nodeWidth : 120,
		nodeHeight : 20,
		treeWidth : 450,
		treeHeight : 450
	};
	
	var pgStyles = {
		blanket : {stroke: "none", fill: "#fff", "opacity": 0.0},
		link : {
			stroke:"#333333",
			"stroke-width" : 2
		},
		action : {
			init : {
				box : {stroke: "#003DF5", "stroke-dasharray": "-.", fill: "#fff", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#000", "font-size": 10}
			},
			inProgress : {
				box : {fill: "#0F4BFF", stroke: "#003DF5", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#fff", "font-size": 10}
			},
			success : {
				box : {fill: "#FFF", stroke: "#003DF5", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#000", "font-size": 10}				
			},
			failure : {
				box : {fill: "#FF794D", stroke: "#003DF5", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#fff", "font-size": 10}
			}
		},
		parameter : {
			notReady : {
				box : {fill: "#fff", stroke: "#FF6633", "stroke-dasharray": "-.", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#000", "font-size": 10}
			},
			hasValue : {
				box : {fill: "#FF794D", stroke: "#FF6633", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#fff", "font-size": 10}
			},
			success : {
				box : {fill: "#fff", stroke: "#FF6633", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#000", "font-size": 10}
			},
			failure : {
				box : {fill: "#FF794D", stroke: "#FF6633", "fill-opacity": 0.8, "stroke-width": 2},
				label : {fill:"#fff", "font-size": 10}
			}
		},
		tooltip : {
			frame : {fill: "#303030", stroke: "#474747", "stroke-width": 2, "fill-opacity": 0.8},
			label : {fill:"#fff", "font-size": 9},
			mentalState : {
				empty : {"fill-opacity": 1, stroke : '#838383', "stroke-width": 1},
				fill : {fill: '#00B88A', "fill-opacity": 0.8, stroke : '#838383', "stroke-width": 1}
			}
		},
		boxMouseOver : {
			"fill-opacity" : 0.9,
			"stroke-width": 4
		},
		labelMouseOver : {
			
		},
		boxMouseOut : {
			"fill-opacity" : 0.8,
			"stroke-width": 2
		},
		labelMouseOut : {
			
		}	
	};
	return new PlanGraph('pgvis', pgSettings, pgStyles);
}

function handle_incoming_message(msg){
    switch(msg.type) {
        case "chat":
            chat_handle_message(msg); //defined in specific mode js files
            break;
		case "select_map_resp":
			map_slider_handle_message(msg);	// defined in mode_1.js
			break;
        default:
            //console.log("Unhandled msg.type=> ", msg.type);
            break;
    }
}

function quit_handlers(client) {
    window.onbeforeunload = function() {
    /*The below need to occur at 'onbeforeunload', NOT at window unload.*/ 
        client.disconnect(); //XXX ask User if they want to leave here?
        //Time-filler function to let client correctly disconnect:
        $("#logout").animate({opacity:1.0}, 1000);
    };
    $(window).unload(function() {
        //client.disconnect();
        //$("#logout").animate({opacity:1.0}, 1000);
    });
}

function onRequestPlanGraphSuccess(response) {
	dotpg.clear();
	dotpg.loadXML(response);
	dotpg.draw();
};

function requestPlanGraph() {
	var url = "/dialogues/" + CHANNEL_ID + "/plangraph/";
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		success: onRequestPlanGraphSuccess
	});
};

function addControls() {
	//map.addControl(new OpenLayers.Control.PanZoom());
	//pubmap.addControl(new OpenLayers.Control.LayerSwitcher());
	//map.addControl(new OpenLayers.Control.MousePosition());
	//pubmap.addControl(new OpenLayers.Control.LayerSwitcher());
	//pubmap.addControl(new OpenLayers.Control.PanZoomBar());
	pubmap.addControl(new OpenLayers.Control.ScaleLine());
};

function onRequestMapSuccess(response) {
	pubmap.destroy();
	pubmap = wmcParser.read(response, {map: 'pub_mapvis'});
	addControls();
};

function onRequestTextSuccess(response) {
	from = "SYSTEM";
	chat_add_message(from, response);
};

function onRequestResponsesSuccess(responses) {
	for (var i=0; i < responses.length; i++) {
		requestResponseContent(responses[i]);
	};
};

function onRequestMessagesSuccess(responses) {
	// process the messages from the oldest ones
	for (var i = responses.length - 1; i >= 0; i--){
		var from = responses[i].author_id;
		if (from === USERNAME)
			from = "ME";
		chat_add_message(from, responses[i].content);
	};
};

function requestResponseContent (response) {
	var url = "/dialogues/" + CHANNEL_ID + "/responses/" + response.id + "/";
	if (response.type == "map") {
		$.ajax({ type: "GET", url: url, dataType: "xml", success: onRequestMapSuccess});
	}
	else if (response.type == "text") {
		$.ajax({ type: "GET", url: url, dataType: "text", success: onRequestTextSuccess});
	}
	// more...
};

var currResponse = 0;
function requestPrevResponse() {
	if (currResponse <=0) {
		currResponse = currResponse - 1;
		var url = "/dialogues/" + CHANNEL_ID + "/responses/" + currResponse + "/";
		$.ajax({ type: "GET", url: url, dataType: "xml", success: onRequestMapSuccess});
		
	}
};
function requestNextResponse() {
	if (currResponse < 0) {
		currResponse = currResponse + 1;
		var url = "/dialogues/" + CHANNEL_ID + "/responses/" + currResponse + "/";
		$.ajax({ type: "GET", url: url, dataType: "xml", success: onRequestMapSuccess});
	} 
};


function requestResponses() {
	var url = "/dialogues/" + CHANNEL_ID + "/responses/";
	$.ajax({
		type: "GET",
		url: url,
		dataType: "json",
		success: onRequestResponsesSuccess
	});
};

function requestMessages() {
	var url = "/dialogues/" + CHANNEL_ID + "/messages/";
	$.ajax({
		type: "GET",
		url: url,
		dataType: "json",
		success: onRequestMessagesSuccess
	});
};

$(document).ready(function(){
	/***********************************
	// STOMP client initiation
	***********************************/
    client = new STOMPClient();
    client.onopen = function() { 
        quit_handlers(client);
    };
    client.onclose = function(c) { 
        //TODO: Warn User of lost connection + Disallow editing.
        //console.log('Lost Connection, Code: ' + c);
    };
    client.onerror = function(error) { 
        //console.log("======= onerror =========: " + error); 
    };
    client.onerrorframe = function(frame) { 
        //console.log("======= onerrorframe =========:  " + frame.body); 
    };

    client.onconnectedframe = function() { 
        client.subscribe(CHANNEL_NAME); 
    };

    client.onmessageframe = function(frame) { //check frame.headers.destination?
        //console.log("---onmessageframe ---", frame);
        var msg = JSON.parse(frame.body);
        handle_incoming_message(msg);
    };
    var cookie = $.cookie(SESSION_COOKIE_NAME);
    client.connect(HOST, STOMP_PORT, USERNAME, cookie);
    
	/**********************************
	// PlanGraph Initialization
	***********************************/
	plangraph_create_box("Plan Graph");
    dotpg = initiate_planraph();
	requestPlanGraph();
	/**********************************
	// Map Initialization
	***********************************/
	var mapSettings = {
		//projection: new OpenLayers.Projection('EPSG:900913'),
		//displayProjection: new OpenLayers.Projection('EPSG:900913'),
		//units: 'm',
		//numZoomLevels: 20,
		//maxResolution: '156543.0339',
		//maxExtent: OpenLayers.Bounds.fromString('-8679157,4971158.57086,-8655805.51884,4993707.49420')
		maxExtent: new OpenLayers.Bounds(-130, 14, -60, 55)
	};
	pubmap = new OpenLayers.Map('pub_mapvis', mapSettings);
	wmcParser = new OpenLayers.Format.WMC({'layerOptions': {buffer: 0}, 'version':'1.1.0.ex'});
	var mapnik = new OpenLayers.Layer.OSM.Mapnik(
    	"OpenStreetMap (Mapnik)"
    );
	var vlayer = new OpenLayers.Layer.Vector( "Editable" );
	var options = {
                projection: new OpenLayers.Projection("EPSG:900913"),
                displayProjection: new OpenLayers.Projection("EPSG:4326"),
                units: "m",
                maxResolution: 156543.0339,
                maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
                                                 20037508.34, 20037508.34),
				controls: [
                        new OpenLayers.Control.PanZoom(),
                        new OpenLayers.Control.EditingToolbar(vlayer),
						new OpenLayers.Control.LayerSwitcher(),
						new OpenLayers.Control.PanZoomBar()
                    ]
            };
	primap = new OpenLayers.Map('pri_mapvis', options);	
	primap.addLayers([mapnik, vlayer]);
	primap.zoomToExtent(new OpenLayers.Bounds(-13852053.638602437, 933101.2722854596, -4975574.699678951, 7526228.245446581));
	requestResponses();
	/**********************************
	// Chat Initialization
	***********************************/
	chat_create_box("Dialogue");
	if (isParticipating == "True") {
		// read only if not participating...
		$("#chat_type_box").attr("disabled", false);
		$("#chat_type_box").keydown(chat_handle_typing);
	}
	else {
		// read only if not participating...
		$("#chat_type_box").attr("disabled", true);
	}
	requestMessages();
	/**********************************
	// UI Initialization
	***********************************/
	$(".panel_title").hover(
		function() {
			$(this).css("background-color", "#C4C4C4");
		}, 
		function() {
			$(this).css("background-color", "#D1D5DF");
		}
	);
	$("#share_to_pub").click(
		function() {
			open_map_slider();
		}
	);
	$("#merge_to_pri").click(
		function() {
			open_map_slider();
		}
	);
	$("#get_prev_response").click(
		function() {
			requestPrevResponse();
		}
	);
	$("#get_next_response").click(
		function() {
			requestNextResponse();
		}
	);

});

