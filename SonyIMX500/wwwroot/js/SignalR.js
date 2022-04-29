function addEvent(id, type, deviceId, modelId, source, time, data) {
    var dataObj = JSON.parse(data);
    var context = {
        eventTime: time,
        eventDeviceId: deviceId,
        eventModelId: modelId,
        eventType: type,
        eventSource: source,
        eventId: id,
        eventData: JSON.stringify(dataObj, undefined, 2)
    };
    var source = document.getElementById('event-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $("#deviceEventsTbl").show();
    $('#deviceEventsDetails').prepend(html);

    if (dataObj.Image == true) {
        var btn_id = "btn-" + id;
        document.getElementById(btn_id).disabled = false;
    }
}