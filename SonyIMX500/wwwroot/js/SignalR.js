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
    var source = document.getElementById('telemetry-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $("#deviceEventsTbl").show();
    $('#deviceEventsDetails').prepend(html);

    if (dataObj.Image == true) {
        var btn_id = "btn-" + id;
        document.getElementById(btn_id).disabled = false;
    }
}

function addCosmosDbEvent(id, type, deviceId, modelId, source, time, hasImage, data) {
    
    var context = {
        eventTime: time,
        deviceId: deviceId,
        eventType: type,
        eventSource: source,
        eventId: id,
        eventData: JSON.stringify(data, undefined, 2)
    };
    var source = document.getElementById('cosmosdb-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $("#deviceEventsTbl").show();
    $('#deviceEventsDetails').prepend(html);

    if (hasImage == true) {
        var btn_id = "btn-" + id;
        document.getElementById(btn_id).disabled = false;
    }
}