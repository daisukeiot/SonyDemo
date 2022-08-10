//
// Canvas
//
var canvas;
var ctx;
var handleSize = 8;
var currentHandle = false;
var isResize = false;
var isMouseDown = false;
var pendingImagePath = '';
var runningInference = false;
var ratio_x = 1;
var ratio_y = 1;
let rect_zone = [0, 0, 0, 0];

function printTime(msg) {
    let dateObj = new Date();
    let hour = dateObj.getHours();
    hour = ('0' + hour).slice(-2);
    let min = dateObj.getMinutes();
    min = ('0' + min).slice(-2);
    let sec = dateObj.getSeconds();
    sec = ('0' + sec).slice(-2);
    time = `${msg} : ${hour}:${min}:${sec}`;
    console.debug(time);
}

function toggleMouseEvent(bDisable) {

    var canvas = document.getElementById('captureImageCanvasOverlay');

    if (bDisable) {
        canvas.removeEventListener('mousedown', mouseDown, false);
        canvas.removeEventListener('mouseup', mouseUp, false);
        canvas.removeEventListener('mousemove', mouseMove, false);
    } else {
        canvas.addEventListener('mousedown', mouseDown, false);
        canvas.addEventListener('mouseup', mouseUp, false);
        canvas.addEventListener('mousemove', mouseMove, false);
    }
}

function disableUiElements(bDisable) {
    $('#captureImageBtn').prop('disabled', bDisable);
    $('#startInferenceBtn').prop('disabled', bDisable);
    $('#stopInferenceBtn').prop('disabled', bDisable);
    $('#safetyDetectionFrequencyRange').prop('disabled', bDisable);
    $('#safetyDetectionImageCountRange').prop('disabled', bDisable);
    $('#startSafetyDetectionBtn').prop('disabled', bDisable);
    $('#stopSafetyDetectionBtn').prop('disabled', bDisable);
}

var region = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};
var offsetX;
var offsetY;

function toggleCanvasLoader(bForceClear) {
    var loader = document.getElementById("canvasLoaderWrapper");

    if (bForceClear) {
        loader.style.display = "none";
    } else {
        if (loader.style.display == "none") {
            loader.style.display = "block";
        } else {
            loader.style.display = "none";
        }
    }
}

function initCanvas(canvasIdOverlay, canvasIdImage) {

    canvas = document.getElementById(canvasIdOverlay);
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.globalCompositeOperation = 'destination-over';

    var $canvas = $('#' + canvasIdOverlay);
    var canvasOffset = $canvas.offset();
    offsetX = canvasOffset.left;
    offsetY = canvasOffset.top;
}

function point(x, y) {
    return {
        x: x,
        y: y
    };
}

function dist(p1, p2) {
    return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
}

function getHandle(mouse) {
    if (dist(mouse, point(region.x, region.y)) <= handleSize) return 'topleft';
    if (dist(mouse, point(region.x + region.w, region.y)) <= handleSize) return 'topright';
    if (dist(mouse, point(region.x, region.y + region.h)) <= handleSize) return 'bottomleft';
    if (dist(mouse, point(region.x + region.w, region.y + region.h)) <= handleSize) return 'bottomright';
    if (dist(mouse, point(region.x + region.w / 2, region.y)) <= handleSize) return 'top';
    if (dist(mouse, point(region.x, region.y + region.h / 2)) <= handleSize) return 'left';
    if (dist(mouse, point(region.x + region.w / 2, region.y + region.h)) <= handleSize) return 'bottom';
    if (dist(mouse, point(region.x + region.w, region.y + region.h / 2)) <= handleSize) return 'right';
    return false;
}

function mouseDown(e) {
    var funcName = arguments.callee.name + "()";
    //console.debug("=>", funcName);

    e.preventDefault();
    e.stopPropagation();

    currentHandle = getHandle(point(e.pageX - offsetX, e.pageY - offsetY));

    if (currentHandle == false) {
        // Clicked not on region's line.
        // Start a new region
        currentHandle = 'bottomright';
        region.x = parseInt(e.clientX - offsetX);
        region.y = parseInt(e.clientY - offsetY);
        isMouseDown = true;
        isResize = false;
        ctx.strokeStyle = "yellow";
    }
    else {
        // Clicked on a corner or on line
        isResize = true;
        drawRegion();
    }
}

function mouseUp(e) {
    var funcName = arguments.callee.name + "()";
    //console.debug("=>", funcName);
    e.preventDefault();
    e.stopPropagation();

    isResize = false;
    isMouseDown = false;

    currentHandle = false;

    ctx.strokeStyle = "green";

    if (region.w < 0) {
        region.x = region.x + region.w;
        region.w = Math.abs(region.w);
    }

    if (region.h < 0) {
        region.y = region.y + region.h;
        region.h = Math.abs(region.h);
    }

    var x = parseInt(region.x / ratio_x).toString();
    var y = parseInt(region.y / ratio_y).toString();
    $('#region_x').html(x.padStart(3, ' '));
    $('#region_y').html(y.padStart(3, ' '));

    var w = parseInt((region.x + region.w) / ratio_x).toString();
    var h = parseInt((region.y + region.h)/ratio_y).toString();

    $('#region_w').html(w.padStart(3, ' '));
    $('#region_h').html(h.padStart(3, ' '));

    rect_zone[0] = x;
    rect_zone[1] = y;
    rect_zone[2] = w;
    rect_zone[3] = h;

    drawRegion();
}

function mouseMove(e) {
    var funcName = arguments.callee.name + "()";
   // console.debug("=>", funcName);

    e.preventDefault();
    e.stopPropagation();

    if (isMouseDown) {
        // draw region (not resize)
        var mouseX = parseInt(e.clientX - offsetX);
        var mouseY = parseInt(e.clientY - offsetY);

        region.w = mouseX - region.x;
        region.h = mouseY - region.y;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRegion();
    }
    else if (isResize) {

        var mousePos = point(e.pageX - offsetX, e.pageY - offsetY);
        switch (currentHandle) {
            case 'topleft':
                region.w += parseInt(region.x - mousePos.x);
                region.h += parseInt(region.y - mousePos.y);
                region.x = mousePos.x;
                region.y = mousePos.y;
                break;
            case 'topright':
                region.w = parseInt(mousePos.x - region.x);
                region.h += parseInt(region.y - mousePos.y);
                region.y = mousePos.y;
                break;
            case 'bottomleft':
                region.w += parseInt(region.x - mousePos.x);
                region.h = parseInt(mousePos.y - region.y);
                region.x = mousePos.x;
                break;
            case 'bottomright':
                region.w = parseInt(mousePos.x - region.x);
                region.h = parseInt( mousePos.y - region.y);
                break;

            case 'top':
                region.h += parseInt(region.y - mousePos.y);
                region.y = mousePos.y;
                break;

            case 'left':
                region.w += parseInt(region.x - mousePos.x);
                region.x = mousePos.x;
                break;

            case 'bottom':
                region.h = parseInt(mousePos.y - region.y);
                break;

            case 'right':
                region.w = parseInt(mousePos.x - region.x);
                break;
        }

        drawRegion();
    }
}

function drawRegion() {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    if (currentHandle == false) {
        // mouse pointer not on a corner / line.  Clear region
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeRect(region.x, region.y, region.w, region.h);
    }
    else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = 'black';
        // ctx.fillRect(region.x, region.y, region.w, region.h);
        // ctx.strokeStyle = "green";
        ctx.strokeRect(region.x, region.y, region.w, region.h);

        var posHandle = point(0, 0);
        switch (currentHandle) {
            case 'topleft':
                posHandle.x = region.x;
                posHandle.y = region.y;
                break;
            case 'topright':
                posHandle.x = region.x + region.w;
                posHandle.y = region.y;
                break;
            case 'bottomleft':
                posHandle.x = region.x;
                posHandle.y = region.y + region.h;
                break;
            case 'bottomright':
                posHandle.x = region.x + region.w;
                posHandle.y = region.y + region.h;
                break;
            case 'top':
                posHandle.x = region.x + region.w / 2;
                posHandle.y = region.y;
                break;
            case 'left':
                posHandle.x = region.x;
                posHandle.y = region.y + region.h / 2;
                break;
            case 'bottom':
                posHandle.x = region.x + region.w / 2;
                posHandle.y = region.y + region.h;
                break;
            case 'right':
                posHandle.x = region.x + region.w;
                posHandle.y = region.y + region.h / 2;
                break;
        }
        ctx.globalCompositeOperation = 'xor';
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.arc(posHandle.x, posHandle.y, handleSize, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }
}

async function GetSingleDevice(device_id, listElementId, resultElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var ret = true; // assume disconnected
    var msg = null;
    var resultElement = document.getElementById(resultElementId);

    try {
        toggleLoader(false);
        if (listElementId) {
            document.getElementById(listElementId).disabled = true;
        }
        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'sony/GetDevice',
            data: {
                device_id: device_id
            },
        }).done(function (response) {
            var json = JSON.parse(response.value);

            if (listElementId) {

                var list = document.getElementById(listElementId);

                list.innerText = null;
                var option = new Option("Select model", "");
                option.disabled = true;
                list.append(option);
                for (var model in json.models) {
                    var modelId = json.models[model].model_version_id.split(":");
                    list.append(new Option(modelId[0], modelId[0]));
                }
                list.options[0].selected = true;
                list.disabled = false;
            }

            if (json.connectionState == 'Connected') {
                ret = false;
            }
        });

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        setResultElement(resultElement, msg);
        toggleLoader(false);
    }
    return ret;
}

async function CaptureSingleImage() {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var startStart = Date.now();

    try {
        pendingImagePath = '';
        var notificationType = $("input[name='safetyDetectionImageNotification']:checked").val();
        var device_id = document.getElementById("safetyDetectionDeviceIdList").value;
        var Mode;
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = 1;
        var FrequencyOfImages = 1;
        var MaxDetectionsPerFrame = null;
        var NumberOfInferencesPerMessage = null;
        var model_id = document.getElementById("safetyDetectionModelIdList").value;

        if (notificationType == 'blob') {
            Mode = 0;
        }
        else {
            Mode = 1;
        }

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StartUploadRetrainingData',
            data: {
                device_id: device_id,
                Mode: Mode,
                FileFormat: FileFormat,
                CropHOffset: CropHOffset,
                CropVOffset: CropVOffset,
                CropHSize: CropHSize,
                CropVSize: CropVSize,
                NumberOfImages: NumberOfImages,
                FrequencyOfImages: FrequencyOfImages,
                MaxDetectionsPerFrame: MaxDetectionsPerFrame,
                NumberOfInferencesPerMessage: NumberOfInferencesPerMessage,
                model_id: model_id
            },
        }).done(function (response) {
            var result = JSON.parse(response.value);
            var millis = Date.now() - startStart;
            console.debug(`StartUploadRetrainingData took = ${Math.floor(millis / 1000)}`);

            if (result.result == "SUCCESS") {
                pendingImagePath = result.outputSubDirectory;
                console.debug(pendingImagePath);

                toggleCanvasLoader(false);
            }
        });

    } catch (err) {
        var millis = Date.now() - start;
        console.debug(`StartUploadRetrainingData() Err took = ${Math.floor(millis / 1000)}`);
    } finally {
        var stopStart = Date.now();
        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StopUploadRetrainingData',
            data: {
                device_id: device_id
            },
        }).done(function (response) {
            var millis = Date.now() - stopStart;
            console.debug(`StopUploadRetrainingData() took = ${Math.floor(millis / 1000)}`);
        });
    }
    return pendingImagePath;
}

async function StopUploadRetrainingData() {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var resultElement = document.getElementById('startUploadRetrainingDataBtnResult');

    try {
        toggleLoader(false);
        var device_id = document.getElementById("startUploadRetrainingDataDeviceIdList").value;

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StopUploadRetrainingData',
            data: {
                device_id: device_id
            },
        }).done(function (response) {
        });
    } catch (err) {
        setResultElement(resultElement, err);
    } finally {
        toggleLoader(true);
    }
    return ret;
}

// process SignalR message for Telemetry
async function processTelemetryMessage(signalRMsg) {

    var funcName = arguments.callee.name + "()";
    //console.debug("=>", funcName);

    var notificationType = $("input[name='safetyDetectionImageNotification']:checked").val();

    if (notificationType != 'telemetry') {
        return;
    }

    if (pendingImagePath.length == 0) {
        return;
    }

    var imagePath = pendingImagePath.split("/");

    if (imagePath.length != 4) {
        return;
    }

    try {
        var message = JSON.parse(signalRMsg);
        if (message.deviceId != currentDeviceId) {
            return;
        }

        for (var inferenceResult in message.inferenceResults) {
            var imagePath = `${imagePath[1]}/${imagePath[2]}/${imagePath[3]}/${message.inferenceResults[inferenceResult].T}.jpg`;
            CheckImage(currentDeviceId, imagePath);
        }
    } catch (err) {
    } finally {
        //printTime("processTelemetryMessage exit");
    }
}

// process SignalR message for Telemetry
async function processTelemetryForChart(signalRMsg, lineChart) {

    var funcName = arguments.callee.name + "()";
    //console.debug("=>", funcName);

    try {
        var message = JSON.parse(signalRMsg);

        if (message.data == null) {
            return;
        }

        // add device id filter.
        var inferenceData = JSON.parse(message.data);
        lineChart.data.labels.push(message.eventTime);
        lineChart.data.datasets[0].data.push(inferenceData.Inferences[0][1].P);
        lineChart.update();

    } catch (err) {
    } finally {
        //printTime("processTelemetryForChart exit");
    }
}

// process SignalR message for Cosmos DB
async function processCosmosDbMessage(signalRMsg, threshold) {

    var funcName = arguments.callee.name + "()";
    // console.debug("=>", funcName);
    printTime("processCosmosDbMessage ==>");

    var notificationType = $("input[name='safetyDetectionImageNotification']:checked").val();

    if (notificationType != 'cosmosDb') {
        return;
    }

    if (pendingImagePath.length == 0) {
        return;
    }

    var imagePath = pendingImagePath.split("/");

    if (imagePath.length != 4) {
        return;
    }

    try {
        var message = JSON.parse(signalRMsg);

        if (message.deviceId != currentDeviceId) {
            return;
        }

        for (var inferenceResult in message.inferenceResults) {

            var imagePath = `${imagePath[1]}/${imagePath[2]}/${imagePath[3]}/${message.inferenceResults[inferenceResult].T}.jpg`;
            //var found = await CheckImage(currentDeviceId, imagePath);

            await CheckImageForInference(currentDeviceId, imagePath, message.inferenceResults[inferenceResult].inferenceResults, threshold);
        }
    } catch (err) {
    } finally {
        printTime("processCosmosDbMessage <==");
    }
}

// process SignalR message for Blob
async function processBlobMessage(signalRMsg) {

    var funcName = arguments.callee.name + "()";
    //console.debug("=>", funcName);

    var notificationType = $("input[name='safetyDetectionImageNotification']:checked").val();

    if (notificationType != 'blob') {
        return;
    }

    if (pendingImagePath.length == 0) {
        return;
    }

    var imagePath = pendingImagePath.split("/");

    if (imagePath.length != 4) {
        return;
    }

    try {
        var message = JSON.parse(signalRMsg);
        var blobPath = message.blobPath.split("/");

        if (imagePath[1] != document.getElementById("safetyDetectionDeviceIdList").value) {
            return;
        } else if (blobPath[0] != imagePath[1]) {
            return;
        } else if (blobPath[1] != imagePath[2]) {
            return;
        } else if (blobPath[2] != imagePath[3]) {
            return;
        }

        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'home/GetImagesFromBlob',
            data: {
                deviceId: imagePath[1],
                imagePath: message.blobPath
            }
        }).done(function (response) {
            console.debug(response.value);
            var json = JSON.parse(response.value);
            var canvas = document.getElementById("captureImageCanvas");
            var ctx = canvas.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }

            toggleCanvasLoader(true);
        });
    } catch (err) {
    } finally {
    }
}

async function CheckImage(deviceId, imagePath) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);
    var found = false;

    try {
        toggleCanvasLoader(false);
        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'home/checkImage',
            data: {
                deviceId: deviceId,
                imagePath: imagePath
            }
        }).done(function (response) {
            console.debug(response.value);
            var json = JSON.parse(response.value);
            var canvasImage = document.getElementById("captureImageCanvas");
            var ctxImage = canvasImage.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                ctxImage.clearRect(0, 0, canvas.width, canvas.height);
                ctxImage.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            found = true;
        });
    } catch (err) {
    } finally {
        canvasImage.setAttribute("style", "z-index: 100");
        canvas.setAttribute("style", "z-index: 200");
        toggleCanvasLoader(true);
    }

    return found;
}

async function CheckImageForInference(deviceId, imagePath, inferenceResults, threshold) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);
    var found = false;

    try {
        //toggleCanvasLoader(false);
        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'home/checkImage',
            data: {
                deviceId: deviceId,
                imagePath: imagePath
            }
        }).done(function (response) {
            console.debug(response.value);

            var canvasId;
            if (isSafetyDetectionRunning == true) {
                canvasId = 'inferenceImageCanvas';
            }
            else {
                canvasId = 'captureImageCanvas';
            }

            var json = JSON.parse(response.value);
            var canvasImage = document.getElementById(canvasId);
            var ctxImage = canvasImage.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                ctxImage.clearRect(0, 0, canvas.width, canvas.height);
                ctxImage.globalCompositeOperation = 'destination-over';
                ctxImage.drawImage(img, 0, 0, canvas.width, canvas.height);

                ratio_x = canvasImage.width / img.width;
                ratio_y = canvasImage.height / img.height;

                for (var i = 0; i < inferenceResults.length; i++) {
                    data = inferenceResults[i];

                    if (data.P < threshold) {
                        continue;
                    }

                    ctxImage.font = '12px serif';
                    ctxImage.lineWidth = 1;
                    ctxImage.textBaseline = "bottom";
                    ctxImage.strokeStyle = "yellow";
                    var offset_x = canvasImage.width / img.width;
                    var offset_y = canvasImage.height / img.height;

                    var X = parseInt(data.X * offset_x);
                    var Y = parseInt(data.Y * offset_y);
                    var x = parseInt(data.x * offset_x);
                    var y = parseInt(data.y * offset_y);
                    ctxImage.lineWidth = 2;
                    ctxImage.strokeRect(X, Y, x - X, y - Y);

                    var confidence = `${(data.P * 100).toFixed(1).toString()}%`;
                    ctxImage.lineWidth = 1;
                    ctxImage.strokeText(confidence, X + 2, y);
                }

                canvasImage.setAttribute("style", "z-index: 100; position:absolute;");
                canvas.setAttribute("style", "z-index: 200; position:relative;");

            }
            found = true;
        });
    } catch (err) {
    } finally {
        toggleCanvasLoader(true);
    }

    return found;
}

async function StartInference(resultElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var resultElement = document.getElementById(resultElementId);

    try {
        runningInference = true;
        var frequency = parseInt(document.getElementById("safetyDetectionFrequencyRange").value);
        // to ms
        frequency = Math.round((frequency * 1000) / 33.3);
        var notificationType = $("input[name='safetyDetectionImageNotification']:checked").val();
        var Mode;
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = document.getElementById("safetyDetectionImageCountRange").value;
        var FrequencyOfImages = frequency.toString();
        var MaxDetectionsPerFrame = null;
        var NumberOfInferencesPerMessage = null;
        var model_id = document.getElementById("safetyDetectionModelIdList").value;

        if (notificationType == 'blob') {
            Mode = 0;
        }
        else {
            Mode = 1;
        }

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StartUploadRetrainingData',
            data: {
                device_id: currentDeviceId,
                Mode: Mode,
                FileFormat: FileFormat,
                CropHOffset: CropHOffset,
                CropVOffset: CropVOffset,
                CropHSize: CropHSize,
                CropVSize: CropVSize,
                NumberOfImages: NumberOfImages,
                FrequencyOfImages: FrequencyOfImages,
                MaxDetectionsPerFrame: MaxDetectionsPerFrame,
                NumberOfInferencesPerMessage: NumberOfInferencesPerMessage,
                model_id: model_id
            },
        }).done(function (response) {
            var result = JSON.parse(response.value);

            if (result.result == "SUCCESS") {
                pendingImagePath = result.outputSubDirectory;
                toggleCanvasLoader(false);
                setResultElement(resultElement, `Processing images @ ${pendingImagePath}`);
            }
            else {
                setResultElement(resultElement, `Failed to start : ${result.result}`);
            }
        });

    } catch (err) {
        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StopUploadRetrainingData',
            data: {
                device_id: currentDeviceId
            },
        }).done(function (response) {
        });
    } finally {
    }
    return;
}

async function StartSafetyZone(resultElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var resultElement = document.getElementById(resultElementId);

    try {

        setResultElement(resultElement, `Starting Safety Zone Inference`);
        runningInference = true;
        var frequency = parseInt(document.getElementById("safetyDetectionFrequencyRange").value);
        // to ms
        frequency = Math.round((frequency * 1000) / 33.3);
        var notificationType = $("input[name='safetyDetectionImageNotification']:checked").val();
        var Mode;
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = 0; // continuous
        var FrequencyOfImages = frequency.toString();
        var MaxDetectionsPerFrame = null;
        var NumberOfInferencesPerMessage = null;
        var model_id = document.getElementById("safetyDetectionModelIdList").value;

        if (notificationType == 'blob') {
            Mode = 0;
        }
        else {
            Mode = 1;
        }

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StartUploadRetrainingData',
            data: {
                device_id: currentDeviceId,
                Mode: Mode,
                FileFormat: FileFormat,
                CropHOffset: CropHOffset,
                CropVOffset: CropVOffset,
                CropHSize: CropHSize,
                CropVSize: CropVSize,
                NumberOfImages: NumberOfImages,
                FrequencyOfImages: FrequencyOfImages,
                MaxDetectionsPerFrame: MaxDetectionsPerFrame,
                NumberOfInferencesPerMessage: NumberOfInferencesPerMessage,
                model_id: model_id
            },
        }).done(function (response) {
            var result = JSON.parse(response.value);

            if (result.result == "SUCCESS") {
                pendingImagePath = result.outputSubDirectory;
                toggleCanvasLoader(false);
                setResultElement(resultElement, `Processing images @ ${pendingImagePath}`);
            }
            else {
                setResultElement(resultElement, `Failed to start : ${result.result}`);
            }
        });

    } catch (err) {
        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StopUploadRetrainingData',
            data: {
                device_id: currentDeviceId
            },
        }).done(function (response) {
        });
    } finally {
    }
    return;
}


async function StopInference(resultElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var resultElement = undefined;

    if (resultElementId != undefined) {
        resultElement = document.getElementById(resultElementId);
    }
    runningInference = false;
    pendingImagePath = '';

    try {

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StopUploadRetrainingData',
            data: {
                device_id: currentDeviceId
            },
        }).done(function (response) {
            if (resultElementId != undefined) {
                setResultElement(resultElement, "Stopped");
            }
        });
    } catch (err) {
        if (resultElementId != undefined) {
            setResultElement(resultElement, err.toString());
        }
    } finally {
    }
}

function isInArea(rect_zone, rect_obj) {


}