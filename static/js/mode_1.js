/*
specific functions for mode 1: experiment setting
*/
function chat_handle_typing(ev){
   if (ev.keyCode != 13) return; /* if not 'Enter' pressed */
    var msg = $(this).val();
    if (msg == "" || msg == "\n") {
        $(this).val(""); /* Clear the textarea */
        return;
    }
    //console.log(msg);
    $(this).val(""); /* Clear the textarea */
    chat_send_message(msg);
    //open_map_slider();
	return false;
};

function chat_send_message(msg){
    var fullmsg = {"type":"chat", "msg":msg};
    fullmsg = JSON.stringify(fullmsg); 
    client.send(fullmsg, CHANNEL_NAME);
};

function chat_handle_message(msg){
	var text = msg.msg;
    var from = msg.from; 
	if (from == USERNAME) from = "me";
    chat_add_message(from, text);
	if (msg.status == "success") {
		requestPlanGraph();
		// request and show all the non-map types of responses
		for (var i=0; i < msg.responses.length; i++) {
			if (msg.responses[i].type != "map")
				requestResponseContent(msg.responses[i]);
		};
		// ask the user to select approriate map response
		if (from == "me") {
			open_map_slider();
		}
		else {
			// set the chat box to read only
			$("#chat_type_box").attr("disabled", true);
			// remind the user to stand by
			open_standby_box(from);
		}
	}
};

function map_slider_handle_closing() {
	respId = $('#mapslider .selected .map_id').text();
	map_slider_send_message(respId);
};

function map_slider_send_message(respId) {
	var fullmsg = {"type":"select_map_resp", "respId":respId};
	fullmsg = JSON.stringify(fullmsg); 
    client.send(fullmsg, CHANNEL_NAME);
};

function map_slider_handle_message(msg) {
	var from = msg.from;
	var response = msg.response;
	// request and show the selected map response
	requestResponseContent(response);
	if (from != USERNAME) {
		// enable the chat box 
		$("#chat_type_box").attr("disabled", false);
		// close the standby box if it's still open
		$.fn.colorbox.close();
	}
};

function open_standby_box(from) {
	$.fn.colorbox({html: "<p>Please wait for " + from + " to select the appropriate map...</p>", href: false, close: "CLOSE", overlayClose: true, onCleanup: false});
};


function open_map_slider() {
	$.fn.colorbox({html: false, href:"/dialogues/"+CHANNEL_ID+"/maplist/", innerWidth: "890px", close: "SELECT", overlayClose: false, onCleanup: map_slider_handle_closing});
};


