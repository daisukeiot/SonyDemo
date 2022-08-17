//
// Canvas
//
var captureOvelayCanvas;
var captureOverlayCanvasCtx;
var captureCanvas;
var captureCanvasCtx;
var captureOverlayCanvasOffset_X;
var captureOverlayCanvasOffset_Y;

var handleSize = 8;
var currentHandle = false;
var isResize = false;
var isMouseDown = false;
var pendingImagePath = '';
var runninigSafetyZone = false;
var captureInProgress = false;

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

    if (bDisable) {
        captureOvelayCanvas.removeEventListener('mousedown', mouseDown, false);
        captureOvelayCanvas.removeEventListener('mouseup', mouseUp, false);
        captureOvelayCanvas.removeEventListener('mousemove', mouseMove, false);
    } else {
        captureOvelayCanvas.addEventListener('mousedown', mouseDown, false);
        captureOvelayCanvas.addEventListener('mouseup', mouseUp, false);
        captureOvelayCanvas.addEventListener('mousemove', mouseMove, false);
    }
}

function disableUiElements(bDisable) {
    $('#captureImageBtn').prop('disabled', bDisable);
    $('#captureStartInferenceBtn').prop('disabled', bDisable);
    $('#captureStopInferenceBtn').prop('disabled', bDisable);
    $('#safetyDetectionFrequencySlider').prop('disabled', bDisable);
    $('#safetyDetectionImageCountSlider').prop('disabled', bDisable);
    $('#startSafetyDetectionBtn').prop('disabled', bDisable);
    $('#stopSafetyDetectionBtn').prop('disabled', bDisable);
}

var region = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};

function toggleCanvasLoader(bForceClear) {

    if (isSafetyDetectionRunning == true) {
        canvasId = 'safetyDetectionCanvasLoaderWrapper';
    }
    else {
        canvasId = 'captureImageCanvasLoaderWrapper';
    }

    var loader = document.getElementById(canvasId);

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

function initCaptureCanvas(canvasIdOverlay, canvasIdImage) {

    captureCanvas = document.getElementById(canvasIdImage);
    captureCanvasCtx = captureCanvas.getContext("2d");
    captureOvelayCanvas = document.getElementById(canvasIdOverlay);
    captureOverlayCanvasCtx = captureOvelayCanvas.getContext("2d");
    captureOverlayCanvasCtx.strokeStyle = "red";
    captureOverlayCanvasCtx.lineWidth = 3;
    captureOverlayCanvasCtx.globalCompositeOperation = 'destination-over';

    var $canvas = $('#' + canvasIdOverlay);
    var canvasOffset = $canvas.offset();
    captureOverlayCanvasOffset_X = canvasOffset.left;
    captureOverlayCanvasOffset_Y = canvasOffset.top;
}

function initSafetyDetectionCanvas(canvasIdOverlay, canvasIdImage) {

//    captureOvelayCanvas = document.getElementById(canvasIdOverlay);
//    captureOverlayCanvasCtx = captureOvelayCanvas.getContext("2d");
//    captureOverlayCanvasCtx.strokeStyle = "yellow";
//    captureOverlayCanvasCtx.lineWidth = 3;
}

function ClearCaptureCanvas()
{
    captureCanvasCtx.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
    captureOverlayCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
    captureCanvasCtx.rect(0, 0, captureCanvas.width, captureCanvas.height);
    captureCanvasCtx.fillStyle = 'lightgray';
    captureCanvasCtx.fill();
    captureCanvasCtx.stroke();
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

    currentHandle = getHandle(point(e.pageX - captureOverlayCanvasOffset_X, e.pageY - captureOverlayCanvasOffset_Y));

    if (currentHandle == false) {
        // Clicked not on region's line.
        // Start a new region
        currentHandle = 'bottomright';
        region.x = parseInt(e.clientX - captureOverlayCanvasOffset_X);
        region.y = parseInt(e.clientY - captureOverlayCanvasOffset_Y);
        isMouseDown = true;
        isResize = false;
        captureOverlayCanvasCtx.strokeStyle = "yellow";
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
        var mouseX = parseInt(e.clientX - captureOverlayCanvasOffset_X);
        var mouseY = parseInt(e.clientY - captureOverlayCanvasOffset_Y);

        region.w = mouseX - region.x;
        region.h = mouseY - region.y;

        captureOverlayCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
        drawRegion();
    }
    else if (isResize) {

        var mousePos = point(e.pageX - captureOverlayCanvasOffset_X, e.pageY - captureOverlayCanvasOffset_Y);
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

    captureOverlayCanvasCtx.strokeStyle = "red";

    if (currentHandle == false) {
        // mouse pointer not on a corner / line.  Clear region
        captureOverlayCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
        captureOverlayCanvasCtx.strokeRect(region.x, region.y, region.w, region.h);
    }
    else {
        captureOverlayCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
        captureOverlayCanvasCtx.strokeRect(region.x, region.y, region.w, region.h);

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
        captureOverlayCanvasCtx.globalCompositeOperation = 'xor';
        captureOverlayCanvasCtx.beginPath();
        captureOverlayCanvasCtx.arc(posHandle.x, posHandle.y, handleSize, 0, 2 * Math.PI);
        captureOverlayCanvasCtx.fillStyle = 'white';
        captureOverlayCanvasCtx.fill();
        captureOverlayCanvasCtx.stroke();
        captureOverlayCanvasCtx.globalCompositeOperation = 'source-over';
    }
}



async function CaptureSingleImage(resultElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var resultElement = null;
    captureInProgress = true;

    try {

        pendingImagePath = '';

        if (resultElementId != null) {
            resultElement = document.getElementById(resultElementId);
        }

        setResultElement(resultElement, `Capturing a single image from ${currentDeviceId}`);

        var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();
        var device_id = currentDeviceId;
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
        var model_id = currentModelId;

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

            if (result.result == "SUCCESS") {
                pendingImagePath = result.outputSubDirectory;
                setResultElement(resultElement, `Waiting for an image at ${pendingImagePath}`);
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

    var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();

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

        var p_value = 0.0;

        if (inferenceData.Inferences[0][1] != undefined) {
            p_value = inferenceData.Inferences[0][1].P
        }

        lineChart.data.datasets[0].data.push(p_value);
        lineChart.update();

    } catch (err) {
        console.error("Error processing Telemetry data for chart ");
    } finally {
        //printTime("processTelemetryForChart exit");
    }
}

// process SignalR message for Cosmos DB
async function processCosmosDbMessage(signalRMsg, threshold) {

    var funcName = arguments.callee.name + "()";
    // console.debug("=>", funcName);
    printTime("processCosmosDbMessage ==>");

    var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();

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

        if (captureInProgress == true) {

            var imageUrl = `${imagePath[1]}/${imagePath[2]}/${imagePath[3]}/${message.inferenceResults[0].T}.jpg`;

            var found = await CheckImageForInference(currentDeviceId, imageUrl, null, threshold);

            if (found) {
                var resultElement = document.getElementById('captureImageBtnResult');
                setResultElement(resultElement, 'Image loaded');
                captureInProgress = false;
            }
        }
        else {
            for (var inferenceResult in message.inferenceResults) {

                var imageUrl = `${imagePath[1]}/${imagePath[2]}/${imagePath[3]}/${message.inferenceResults[inferenceResult].T}.jpg`;
                await CheckImageForInference(currentDeviceId, imageUrl, message.inferenceResults[inferenceResult].inferenceResults, threshold);
            }
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

    var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();

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
            var captureOvelayCanvas = document.getElementById("captureImageCanvas");
            var captureOverlayCanvasCtx = captureOvelayCanvas.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                captureOverlayCanvasCtx.drawImage(img, 0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height)
            }

            toggleCanvasLoader(true);
        });
    } catch (err) {
    } finally {
    }
}


async function CheckImageForInference(deviceId, imagePath, inferenceResults, threshold) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);
    var found = false;

    try {
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
                canvasId = 'safetyDetectionCanvas';
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
                ctxImage.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
                ctxImage.globalCompositeOperation = 'source-over';
                    //'destination-over';
                ctxImage.drawImage(img, 0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);

                ratio_x = canvasImage.width / img.width;
                ratio_y = canvasImage.height / img.height;

                if (inferenceResults != null) {

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
                }
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
        setResultElement(resultElement, `Starting Inference`);
        var frequency = parseInt(document.getElementById("safetyDetectionFrequencySlider").value);
        // to ms
        frequency = Math.round((frequency * 1000) / 33.3);
        var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();
        var Mode;
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = document.getElementById("safetyDetectionImageCountSlider").value;
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

async function StartSafetyDetection(resultElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var resultElement = document.getElementById(resultElementId);

    try {
        runninigSafetyZone = true;
        setResultElement(resultElement, `Starting Safety Zone Inference`);
        var frequency = parseInt(document.getElementById("safetyDetectionFrequencySlider").value);
        // to ms
        frequency = Math.round((frequency * 1000) / 33.3);
        var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();
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


    runninigSafetyZone = false;
    pendingImagePath = '';

    try {

        if (resultElement != undefined) {
            setResultElement(resultElement, `Stopping Inference`);
        }

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