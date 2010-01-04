/*
specific functions for mode 0: normal setting
*/


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
		for (var i=0; i < msg.responses.length; i++) {
			requestResponseContent(msg.responses[i]);
		};
	}

};

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
    return false;
};
