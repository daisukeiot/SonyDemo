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
    $("#device-events").show();
    $('#device-event-details').prepend(html);
}