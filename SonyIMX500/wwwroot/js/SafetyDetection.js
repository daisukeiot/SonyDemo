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

function enableDisableMouseEvent(bEnable) {

    if (bEnable) {
        captureOvelayCanvas.addEventListener('mousedown', mouseDown, false);
        captureOvelayCanvas.addEventListener('mouseup', mouseUp, false);
        captureOvelayCanvas.addEventListener('mousemove', mouseMove, false);
    } else {
        captureOvelayCanvas.removeEventListener('mousedown', mouseDown, false);
        captureOvelayCanvas.removeEventListener('mouseup', mouseUp, false);
        captureOvelayCanvas.removeEventListener('mousemove', mouseMove, false);
    }
}

function disableUiElements(bDisable) {
    $('#captureImageBtn').prop('disabled', bDisable);
    $('#captureStartInferenceBtn').prop('disabled', bDisable);
    $('#captureStopInferenceBtn').prop('disabled', bDisable);
    $('#safetyDetectionFrequencySlider').prop('disabled', bDisable);
    $('#safetyDetectionImageCountSlider').prop('disabled', bDisable);
    $('#startSafetyDetectionBtn').prop('disabled', bDisable);
    $('#startSafetyDetectionWithImageBtn').prop('disabled', bDisable);
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
    var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

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
    var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);
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
    var h = parseInt((region.y + region.h) / ratio_y).toString();

    $('#region_w').html(w.padStart(3, ' '));
    $('#region_h').html(h.padStart(3, ' '));

    rect_zone[0] = x;
    rect_zone[1] = y;
    rect_zone[2] = w;
    rect_zone[3] = h;

    drawRegion();
}

function mouseMove(e) {
    var funcName = `${arguments.callee.name}()`;
   // console.debug(`=> ${funcName}`);

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
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

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
    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)
    var resultElement = null;
    captureInProgress = true;

    try {

        pendingImagePath = '';
        isPendingCapture = true;

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
                toggleCanvasLoader(false);
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
    var funcName = `${arguments.callee.name}()`;
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

    var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

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
        console.error(`${funcName} error : ${err.statusText}`)
    } finally {
        //printTime("processTelemetryMessage exit");
    }
}

// process SignalR message for Telemetry
async function processTelemetryForChart(signalRMsg, lineChart) {

    // var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

    try {
        var message = JSON.parse(signalRMsg);

        if (message.data == null) {
            return;
        }

        if (message.deviceId != currentDeviceId) {
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
    }
}

// process SignalR message for Cosmos DB
async function processCosmosDbMessage(signalRMsg, threshold) {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);
    // printTime("processCosmosDbMessage ==>");

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
                capture_photo_url = imageUrl;
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
        // printTime("processCosmosDbMessage <==");
    }
}

// process SignalR message for Blob
async function processBlobMessage(signalRMsg) {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

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
                toggleCanvasLoader(true);
            }
        });
    } catch (err) {
    } finally {
    }
}

async function SetCaptureCanvas(deviceId, imagePath, rect_zone) {

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

            canvasId = 'captureImageCanvas';
            overlayCanvsId = 'captureImageCanvasOverlay';

            var json = JSON.parse(response.value);
            var canvasImage = document.getElementById(canvasId);
            var ctxImage = canvasImage.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                captureCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
                captureCanvasCtx.globalCompositeOperation = 'source-over';
                //'destination-over';
                captureCanvasCtx.drawImage(img, 0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);

                ratio_x = captureOvelayCanvas.width / img.width;
                ratio_y = captureOvelayCanvas.height / img.height;

                captureOverlayCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
                captureOverlayCanvasCtx.strokeRect(rect_zone[0] * ratio_x, rect_zone[1] * ratio_y, (rect_zone[2] - rect_zone[0]) * ratio_x, (rect_zone[3] - rect_zone[1]) * ratio_y);
                toggleCanvasLoader(true);
            }
            found = true;
        }).fail(function (response, status, err) {
            console.error(`SetCaptureCanvas error : ${err.statusText}`)
        });
    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
    } finally {
    }
}

async function CheckImageForInference(deviceId, imagePath, inferenceResults, threshold) {
    // need to clear spinner on exit
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);
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
                overlayCanvsId = 'safetyDetectionCanvasOverlay';
            }
            else {
                canvasId = 'captureImageCanvas';
                overlayCanvsId = 'captureImageCanvasOverlay';
            }

            var json = JSON.parse(response.value);
            var canvasImage = document.getElementById(canvasId);
            var ctxImage = canvasImage.getContext('2d');
            var canvasOverlay = document.getElementById(overlayCanvsId);
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                console.debug("==>Onload");
                ctxImage.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
                ctxImage.globalCompositeOperation = 'source-over';
                    //'destination-over';
                ctxImage.drawImage(img, 0, 0, canvasOverlay.width, canvasOverlay.height);

                ratio_x = canvasImage.width / img.width;
                ratio_y = canvasImage.height / img.height;

                if (isPendingCapture == true) {
                    isPendingCapture = false;
                } else if (inferenceResults != null) {

                    console.debug(`>Inference Result ${inferenceResults.length}`)
                    for (var i = 0; i < inferenceResults.length; i++) {
                        data = inferenceResults[i];

                        console.debug(`>> Threashold ${threshold} P ${data.P}`)
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
                        var w = x - X;
                        var h = y - Y;

                        ctxImage.lineWidth = 2;
                        ctxImage.strokeRect(X, Y, w, h);
                        var confidence = `${(data.P * 100).toFixed(1).toString()}%`;
                        
                        var iou = calcIoU(data.X, data.Y, data.x, data.y);

                        if (iou > 0) {
                            confidence = `${confidence} ${iou}`;
                        }
                        ctxImage.lineWidth = 1;
                        ctxImage.strokeText(confidence, X + 2, y);

                    }
                }
            }
            toggleCanvasLoader(true);
            found = true;
        }).fail(function (response, status, err) {
            console.error(`${funcName}error : ${err.statusText}`);
            toggleCanvasLoader(true);
        });
    } catch (err) {
        console.error(`${funcName}error : ${err.statusText}`)
    } finally {
    }

    return found;
}

async function StartInference(resultElementId) {
    var funcName = `${arguments.callee.name}()`;
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
                setResultElement(resultElement, `Processing images @ ${pendingImagePath}`);
            }
            else {
                setResultElement(resultElement, `Failed to start : ${result.result}`);
            }
        });

    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
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

async function StartSafetyDetection(resultElementId, withImage) {
    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)
    var resultElement = document.getElementById(resultElementId);
    try {
        runninigSafetyZone = true;

        setResultElement(resultElement, `Starting Safety Zone Inference`);
        var frequency = parseInt(document.getElementById("safetyDetectionFrequencySlider").value);
        frequency = Math.round((frequency * 1000) / 33.3);
        var notificationType = $("input[name='imageNotifictionTypeList']:checked").val();
        var model_id = currentModelId;
        var NumberOfInferencesPerMessage = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;

        if (withImage == true) {
            var Mode;
            var FileFormat = null;
            var NumberOfImages = 0; // continuous
            var FrequencyOfImages = frequency.toString();
            var MaxDetectionsPerFrame = null;
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
                    setResultElement(resultElement, `Processing images @ ${pendingImagePath}`);
                }
                else {
                    setResultElement(resultElement, `Failed to start : ${result.result}`);
                }
            });

        }
        else {

            await $.ajax({
                async: true,
                type: "POST",
                url: window.location.origin + '/' + 'sony/StartUploadInferenceResult',
                data: {
                    device_id: currentDeviceId,
                    FrequencyOfInferences: frequency,
                    MaxDetectionsPerFrame: MaxDetectionsPerFrame,
                    CropHOffset: CropHOffset,
                    CropVOffset: CropVOffset,
                    CropHSize: CropHSize,
                    CropVSize: CropVSize,
                    NumberOfInferencesPerMessage: null,
                    model_id: model_id
                },
            }).done(function (response) {
                msg = response.value;
            });
        }

    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
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


async function StopInference(resultElementId, withImage) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> funcName : Image ${withImage}`)
    var resultElement = undefined;
    var bStopped = false;

    if (resultElementId != undefined) {
        resultElement = document.getElementById(resultElementId);
    }

    runninigSafetyZone = false;
    pendingImagePath = '';

    try {
        if (resultElement != undefined) {
            setResultElement(resultElement, `Stopping Inference`);
        }

        var url;
        if (withImage) {
            url = window.location.origin + '/' + 'sony/StopUploadRetrainingData';
        }
        else {
            url = window.location.origin + '/' + 'sony/StopUploadInferenceResult';
        }

        await $.ajax({
            async: true,
            type: "POST",
            url: url,
            data: {
                device_id: currentDeviceId
            },
            statusCode: {
                200: function (data) {
                    if (resultElementId != undefined) {
                        setResultElement(resultElement, "Stopped");
                        bStopped = true;
                    }
                },
                202: function (data) {
                }
            }
        }).then(function (response, textStatus, jqXHR) {
        });
    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
        if (resultElementId != undefined) {
            setResultElement(resultElement, err.statusText);
        }
    } finally {
        if (bStopped == false) {
            // try stopping the other one
            var url;
            if (withImage) {
                url = window.location.origin + '/' + 'sony/StopUploadInferenceResult';
            }
            else {
                url = window.location.origin + '/' + 'sony/StopUploadRetrainingData';
            }

            await $.ajax({
                async: true,
                type: "POST",
                url: url,
                data: {
                    device_id: currentDeviceId
                },
                200: function (data) {
                    if (resultElementId != undefined) {
                        setResultElement(resultElement, "Stopped");
                        bStopped = true;
                    }
                },
                202: function (data) {
                    if (resultElementId != undefined) {
                        setResultElement(resultElement, "Stopped");
                        bStopped = true;
                    }
                }
            }).done(function (response, textStatus, jqXHR) {

            }).fail(function (response, status, err) {
                console.error(`${funcName} error : ${err.statusText}`)
            });
        }
    }

    return bStopped;
}

async function SaveParameterToCookie() {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    await $.ajax({
        async: true,
        type: "POST",
        url: window.location.origin + '/' + 'SafetyDetection/SaveParameters',
        data: {
            device_id: currentDeviceId,
            model_id: currentModelId,
            rect_zone: JSON.stringify(rect_zone),
            threshold: captureThresholdSlider.value,
            capture_photo_url: capture_photo_url
        },
    }).done(function (response) {
        //var result = JSON.parse(response.value);

    });

}

function calcIoU(x0, y0, x1, y1) {
    var iou = 0.0;
    var coverage = 0.0;
    var xI0 = Math.max(x0, rect_zone[0]);
    var yI0 = Math.max(y0, rect_zone[1]);
    var xI1 = Math.min(x1, rect_zone[2]);
    var yI1 = Math.min(y1, rect_zone[3]);

    var areaIntersect = Math.max(0, (xI1 - xI0)) * Math.max(0, (yI1 - yI0));

    var areaRegion = (rect_zone[2] - rect_zone[0]) * (rect_zone[3] - rect_zone[1]);
    var areaInference = (x1 - x0) * (y1 - y0);
    var areaUnion = areaRegion + areaInference - areaIntersect;

    iou = ((areaIntersect * 1.0 )/ areaUnion).toFixed(1);

    if (iou > 0) {
        // calculate percentage the region is included in the zone
        coverage = ((areaIntersect * 1.0) / areaInference).toFixed(1);
    }

    console.debug(`-- IoU ${iou} coverage ${coverage}`);
    return coverage;
}

async function SetDeviceLists(deviceId, modelId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    var deviceListId = 'captureDeviceIdList'
    var resultElementId = 'captureImageBtnResult';

    try {
        toggleLoader(false);
        await GetDevices(deviceListId, true, false, 'Select Device', '0', resultElementId)
            .then(async function (response) {
                document.getElementById(deviceListId).value = deviceId;

                var modelListId = 'captureModelIdList';
                var resultElement = document.getElementById(resultElementId);

                await GetModelForDevice(modelListId, deviceId, resultElementId)
                    .then(async function (isDisconnected) {
                        var deviceList = document.getElementById(deviceListId);
                        document.getElementById(modelListId).value = modelId;
                        deviceList[deviceList.selectedIndex].setAttribute("data-isDisconnected", isDisconnected);

                        if (isDisconnected == false) {
                            await StopInference(null, true);
                        }
                        document.getElementById(modelListId).value = modelId;
                        document.getElementById(modelListId).dispatchEvent(new Event("change"));
                    })
                    .catch((err) => {
                        setResultElement(resultElement, "Failed to retrieve model list");
                    })
                    .finally(() => {
                        toggleLoader(true);
                    });
            })
            .catch((err) => {
                console.error(`${funcName}: ${err.statusText}`)
            })
            .finally(() => {
            })

        var deviceListId = 'safetyDetectionDeviceIdList'
        var resultElementId = 'startSafetyDetectionBtnResult';
        await GetDevices(deviceListId, true, false, 'Select Device', '0', resultElementId)
            .then(async function (response) {
                document.getElementById(deviceListId).value = deviceId;

                var modelListId = 'safetyDetectionModelIdList';
                var resultElement = document.getElementById(resultElementId);

                await GetModelForDevice(modelListId, deviceId, resultElementId)
                    .then(async function (isDisconnected) {
                        var deviceList = document.getElementById(deviceListId);
                        document.getElementById(modelListId).value = modelId;
                        deviceList[deviceList.selectedIndex].setAttribute("data-isDisconnected", isDisconnected);
                        document.getElementById(modelListId).value = modelId;
                        document.getElementById(modelListId).dispatchEvent(new Event("change"));
                    })
                    .catch((err) => {
                        setResultElement(resultElement, "Failed to retrieve model list");
                    })
                    .finally(() => {
                    });

            })
            .catch((err) => {
                console.error(`${funcName}: ${err.statusText}`)
            })
            .finally(() => {
            })
    } finally {
        toggleLoader(true);
    } 
}

const parseCookie = str =>
    str
        .split(';')
        .map(v => v.split('='))
        .reduce((cookie, v) => {
            cookie[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
            return cookie;
    }, {});


