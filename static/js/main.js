var plangraph = null;
var map = null;

function map_handle_message(msg){
    var choice = msg.choice;
    var target = $("#votes_"+choice);
    var current = Number(target.text())+1;
    //console.log("vote_handle_message=> ", choice, current);
    target.text(current);
}

function plangraph_handle_message(msg){
    if (msg.from == USERNAME) return;
    var choice = msg.choice;
    var target = $("#pitch_"+choice+ " textarea");
    switch(msg.event) {
        case "focus":
            break;
            target.append($("<p>").attr("id", "active").text(msg.from+ " is typing..."));
        case "keyup":
            $("<p>").attr("id", "active").remove();
            target.val(msg.content);
            break;
        default:
            break;
    }
}


function handle_incoming_message(msg){
    switch(msg.type) {
        case "map":
            map_handle_message(msg);
            break;
        case "plangraph":
            plangraph_handle_message(msg);
            break;
        case "chat":
            chat_handle_message(msg); //defined in 'chat.js' TODO: namespace better
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
	plangraph.clear();
	plangraph.loadXML(response);
	plangraph.draw();
};

function requestPlanGraph() {
	var url = "/dialogues/" + CHANNEL_ID + "/plangraph";
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		success: onRequestPlanGraphSuccess
	});
};

function addControls() {
	//map.addControl(new OpenLayers.Control.PanZoom());
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	//map.addControl(new OpenLayers.Control.MousePosition());
	map.addControl(new OpenLayers.Control.PanZoomBar());
	map.addControl(new OpenLayers.Control.ScaleLine());
};

function onRequestMapSuccess(response) {
	map.destroy();
	map = wmcParser.read(response, {map: 'mapvis'});
	addControls();
};

var requestMap = function() {
	var url = "/dialogues/" + CHANNEL_ID + "/map";
	$.ajax({
		type: "GET",
		url: url,
		dataType: "xml",
		success: onRequestMapSuccess
	});
};

$(document).ready(function(){
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
	plangraph = new PlanGraph('pgvis', pgSettings, pgStyles);
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
	map = new OpenLayers.Map('mapvis', mapSettings);
	wmcParser = new OpenLayers.Format.WMC({'layerOptions': {buffer: 0}, 'version':'1.1.0.ex'});
	
});

