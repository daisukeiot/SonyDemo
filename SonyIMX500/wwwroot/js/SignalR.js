function addEvent(id, type, deviceId, modelId, dataSource, time, data) {
    var dataObj = JSON.parse(data);
    var context = {
        eventTime: time,
        eventDeviceId: deviceId,
        eventModelId: modelId,
        eventType: type,
        eventSource: dataSource,
        eventId: id,
        eventData: JSON.stringify(dataObj, undefined, 2)
    };
    var source = document.getElementById('telemetry-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $("#telemetryTbl").show();
    $('#telemetryTblDetails').prepend(html);

    var btn_id = "btn-" + id;

    if (dataObj.Image == true) {
        document.getElementById(btn_id).disabled = false;
    }
    else {
        document.getElementById(btn_id).classList.remove('btn-primary');
        document.getElementById(btn_id).classList.add('btn-secondary');
    }
}

function addCosmosDbEvent(id, type, deviceId, modelId, dataSource, time, hasImage, data) {
    
    var context = {
        eventTime: time,
        deviceId: deviceId,
        eventType: type,
        eventSource: dataSource,
        eventId: id,
        eventData: JSON.stringify(data, undefined, 2)
    };
    var source = document.getElementById('cosmosdb-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $("#telemetryTbl").show();
    $('#telemetryTblDetails').prepend(html);

    var btn_id = "btn-" + id;

    if (hasImage == true) {
        document.getElementById(btn_id).disabled = false;
    }
    else {
        document.getElementById(btn_id).classList.remove('btn-primary');
        document.getElementById(btn_id).classList.add('btn-secondary');
    }

}