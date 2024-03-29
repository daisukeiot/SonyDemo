﻿//
// Canvas
//
var captureOvelayCanvas;
var captureOverlayCanvasCtx;
var captureCanvas;
var captureCanvasCtx;
var captureCanvasZoneOverlay;
var captureCanvasZoneOverlayCtx;

var captureOverlayCanvasOffset_X;
var captureOverlayCanvasOffset_Y;

var handleSize = 8;
var currentHandle = false;
var isResize = false;
var isMouseDown = false;
var pendingImagePath = '';
var captureInProgress = false;  // flag to indicate image capture is in progress
var iouStart = null;


var capture_ratio = 2;  // For capture canvas, draw image bigger (640x640 vs. 320x320). 
                        // 320x320 is too small to draw rectangle (or zone) and read letters

var region = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};

// Utility functions for drawing zone
function point(x, y) {
    return {
        x: x,
        y: y
    };
}

function dist(p1, p2) {
    return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
}

// parse yyyymmddhhmmssSSS format to Date object
function getDate(dateString) {

    var date = new Date(Date.UTC(dateString.substr(0, 4), dateString.substr(4, 2), dateString.substr(6, 2), dateString.substr(8, 2), dateString.substr(10, 2), dateString.substr(12, 2), dateString.substr(14, 3)));
    return date;
}

// Utility function to print time in cosole to see timings.
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

// enable/disable mouse events for the top most canvas
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

// Utility function to disable/enable UI elements
function disableUiElements(bDisable) {
    $('#captureImageBtn').prop('disabled', bDisable);
    $('#captureStartInferenceBtn').prop('disabled', bDisable);
    $('#captureStopInferenceBtn').prop('disabled', bDisable);
    $('#captureFrequencySlider').prop('disabled', bDisable);
    $('#captureImageCountSlider').prop('disabled', bDisable);
    $('#zoneDetectionFrequencySlider').prop('disabled', bDisable);
    $('#zoneDetectionImageCountSlider').prop('disabled', bDisable);
    $('#startZoneDetectionBtn').prop('disabled', bDisable);
    $('#startZoneDetectionWithImageBtn').prop('disabled', bDisable);
    $('#stopZoneDetectionBtn').prop('disabled', bDisable);
}

// Display an overlay to show message on capture canvas
function toggleCanvasLoader(bForceClear) {

    if (isZoneDetectionRunning == true) {
        canvasId = 'zoneDetectionCanvasLoaderWrapper';
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

// Initialize capture canvas and draw zone rect
function initCaptureCanvas(canvasIdZoneOverlay, canvasIdOverlay, canvasIdImage) {

    captureCanvas = document.getElementById(canvasIdImage);
    captureCanvasCtx = captureCanvas.getContext("2d");
    captureOvelayCanvas = document.getElementById(canvasIdOverlay);
    captureOverlayCanvasCtx = captureOvelayCanvas.getContext("2d");
    captureOverlayCanvasCtx.strokeStyle = "yellow";
    captureOverlayCanvasCtx.lineWidth = 1;
    captureOverlayCanvasCtx.globalCompositeOperation = 'destination-over';

    captureCanvasZoneOverlay = document.getElementById(canvasIdZoneOverlay);
    captureCanvasZoneOverlayCtx = captureCanvasZoneOverlay.getContext("2d");
    captureCanvasZoneOverlayCtx.strokeStyle = "red";
    captureCanvasZoneOverlayCtx.lineWidth = 3;
}

// Display an image in Capture Canvas.
async function SetCaptureCanvas(deviceId, imagePath, rect_zone) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);
    var found = false;
    var imagePath;
    toggleCanvasLoader(false);

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
            found = true;
            var json = JSON.parse(response.value);
            imagePath = json.uri;
            found = true;

        }).fail(function (response, status, err) {
            console.error(`home/checkImage : error : ${err}`);
            imagePath = '/images/imagenotfoundinblob.jpg';
            //debugger

        }).always(function (response, status, err) {
            canvasId = 'captureImageCanvas';
            overlayCanvsId = 'captureImageCanvasOverlay';

            var canvasImage = document.getElementById(canvasId);
            var canvasImageCtx = canvasImage.getContext('2d');

            var img = new Image();
            img.src = imagePath;
            img.onload = function () {
                canvasImageCtx.clearRect(0, 0, canvasImage.width, canvasImage.height);
                canvasImageCtx.globalCompositeOperation = 'source-over';
                canvasImageCtx.drawImage(img, 0, 0, canvasImage.width, canvasImage.height);

                if (found) {
                    capture_ratio = captureCanvasZoneOverlay.width / img.width;

                    captureCanvasZoneOverlayCtx.clearRect(0, 0, captureCanvasZoneOverlay.width, captureCanvasZoneOverlay.height);
                    captureCanvasZoneOverlayCtx.fillStyle = "red";
                    captureCanvasZoneOverlayCtx.strokeRect(rect_zone[0] * capture_ratio, rect_zone[1] * capture_ratio, (rect_zone[2] - rect_zone[0]) * capture_ratio, (rect_zone[3] - rect_zone[1]) * capture_ratio);
                    captureCanvasZoneOverlayCtx.globalAlpha = 0.3;
                    captureCanvasZoneOverlayCtx.fillRect(rect_zone[0] * capture_ratio, rect_zone[1] * capture_ratio, (rect_zone[2] - rect_zone[0]) * capture_ratio, (rect_zone[3] - rect_zone[1]) * capture_ratio);
                }
            }
        });
    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
    } finally {
        toggleCanvasLoader(true);
    }
}

// clear capture canvas.
function ClearCaptureCanvas() {
    // clear all layers
    captureCanvasCtx.clearRect(0, 0, captureCanvas.width, captureCanvas.height);
    captureOverlayCanvasCtx.clearRect(0, 0, captureOvelayCanvas.width, captureOvelayCanvas.height);
    captureCanvasZoneOverlayCtx.clearRect(0, 0, captureCanvasZoneOverlay.width, captureCanvasZoneOverlay.height);

    // draw gray background
    captureCanvasCtx.rect(0, 0, captureCanvas.width, captureCanvas.height);
    captureCanvasCtx.fillStyle = 'lightgray';
    captureCanvasCtx.fill();
}

// Clear Zone Detection canvas
function ClearZoneDetectionCanvas() {

    // clear all layers
    var canvas = document.getElementById('zoneDetectionCanvasOverlay');
    var canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    canvas = document.getElementById('zoneDetectionCanvasZoneOverlay');
    canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    canvas = document.getElementById('zoneDetectionCanvas');
    canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // draw gray background
    canvasCtx.rect(0, 0, captureCanvas.width, captureCanvas.height);
    canvasCtx.fillStyle = 'lightgray';
    canvasCtx.fill();
}

// returns mouse position
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

////////////////////////////////////////////////////////////////
// Event handlers for mouse move
////////////////////////////////////////////////////////////////

// Process mouse down (Press and hold)
function mouseDown(e) {
    //var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

    e.preventDefault();
    e.stopPropagation();

    currentHandle = getHandle(point(e.pageX - captureOverlayCanvasOffset_X, e.pageY - captureOverlayCanvasOffset_Y));

    if (currentHandle == false) {
        // Clicked not on region's line.
        // Start a new region
        var $canvas = $('#captureImageCanvasZoneOverlay');
        var canvasOffset = $canvas.offset();
        currentHandle = 'bottomright';
        captureOverlayCanvasOffset_X = canvasOffset.left;
        captureOverlayCanvasOffset_Y = canvasOffset.top;
        region.x = parseInt(e.pageX - captureOverlayCanvasOffset_X);
        region.y = parseInt(e.pageY - captureOverlayCanvasOffset_Y);
        isMouseDown = true;
        isResize = false;
        captureCanvasZoneOverlayCtx.strokeStyle = "red";
    }
    else {
        // Clicked on a corner or on line
        isResize = true;
        drawZoneRectangle();
    }
}

// Process mouse button release
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

    var x = parseInt(region.x / capture_ratio).toString();
    var y = parseInt(region.y / capture_ratio).toString();

    $('#region_x').html(x.padStart(3, ' '));
    $('#region_y').html(y.padStart(3, ' '));

    var w = parseInt((region.x + region.w) / capture_ratio).toString();
    var h = parseInt((region.y + region.h) / capture_ratio).toString();

    $('#region_w').html(w.padStart(3, ' '));
    $('#region_h').html(h.padStart(3, ' '));

    rect_zone[0] = x;
    rect_zone[1] = y;
    rect_zone[2] = w;
    rect_zone[3] = h;

    drawZoneRectangle();

    captureCanvasZoneOverlayCtx.globalAlpha = 0.3;
    captureCanvasZoneOverlayCtx.fillStyle = "red";
    captureCanvasZoneOverlayCtx.fillRect(region.x, region.y, region.w, region.h);
}

// Process mouse pointer move
function mouseMove(e) {
    var funcName = `${arguments.callee.name}()`;
   // console.debug(`=> ${funcName}`);

    e.preventDefault();
    e.stopPropagation();

    if (isMouseDown) {
        // draw region (not resize)
        var mouseX = parseInt(e.pageX - captureOverlayCanvasOffset_X);
        var mouseY = parseInt(e.pageY - captureOverlayCanvasOffset_Y);

        region.w = mouseX - region.x;
        region.h = mouseY - region.y;

        captureCanvasZoneOverlayCtx.clearRect(0, 0, captureCanvasZoneOverlay.width, captureCanvasZoneOverlay.height);
        drawZoneRectangle();
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

        drawZoneRectangle();
    }
}

// Draw rectangle.  For capture canvas.
function drawZoneRectangle() {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    captureCanvasZoneOverlayCtx.strokeStyle = "red";
    captureCanvasZoneOverlayCtx.globalAlpha = 1;

    if (currentHandle == false) {
        // mouse pointer not on a corner or on line.  Clear region
        captureCanvasZoneOverlayCtx.clearRect(0, 0, captureCanvasZoneOverlay.width, captureCanvasZoneOverlay.height);
        captureCanvasZoneOverlayCtx.strokeRect(region.x, region.y, region.w, region.h);
    }
    else {
        captureCanvasZoneOverlayCtx.clearRect(0, 0, captureCanvasZoneOverlay.width, captureCanvasZoneOverlay.height);
        captureCanvasZoneOverlayCtx.strokeRect(region.x, region.y, region.w, region.h);

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
        captureCanvasZoneOverlayCtx.globalCompositeOperation = 'xor';
        captureCanvasZoneOverlayCtx.beginPath();
        captureCanvasZoneOverlayCtx.arc(posHandle.x, posHandle.y, handleSize, 0, 2 * Math.PI);
        captureCanvasZoneOverlayCtx.fillStyle = 'white';
        captureCanvasZoneOverlayCtx.fill();
        captureCanvasZoneOverlayCtx.stroke();
        captureCanvasZoneOverlayCtx.globalCompositeOperation = 'source-over';
    }
}

// Start image capture
async function CaptureImage(resultElementId) {
    var funcName = `${arguments.callee.name}()`;
    printTime(`=> ${funcName}`);
    var resultElement = null;
    captureInProgress = true;

    try {
        pendingImagePath = '';

        if (resultElementId != null) {
            resultElement = document.getElementById(resultElementId);
        }

        setResultElement(resultElement, `Capturing image from ${currentDeviceId}`);

        var device_id = currentDeviceId;
        var Mode = 0; // Image only
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = 0;  // potential race condition between API call and SignalR messages.  Use blob message so that we know the image is available.
                                 // Continue to capture until the image is found.
        var FrequencyOfImages = Math.round(500/33); // 0.5 sec.
        var MaxDetectionsPerFrame = null;
        var NumberOfInferencesPerMessage = null;
        var model_id = currentModelId;

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
        console.error(`${funcName}: ${err.responseJSON.value}`)
        setResultElement(resultElement, err.responseJSON.value);
    }
    return pendingImagePath;
}

// process Telemetry SignalR message to update chart
async function processTelemetryMessage(signalRMsg, barChart, threshold, iouThreshold, notificationThreshold) {
    // var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

    if (isZoneDetectionRunning == true) {
        try {
            var message = JSON.parse(signalRMsg);

            if (message.data == null) {
                // no data, just return;
                return;
            }

            // Apply device id filter.
            if (message.deviceId != currentDeviceId) {
                return;
            }

            var inferenceData = JSON.parse(message.data);
            barChart.data.labels.push(message.eventTime);

            var p_value = 0;
            var updateCanvas = (pendingImagePath.length == 0)

            if (updateCanvas == true) {
                // Inference in progress without image (inference results only)
                // Draw bounding box
                var canvasOverlay = document.getElementById('zoneDetectionCanvasOverlay');
                var ctxOverlay = canvasOverlay.getContext('2d');
                ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
            }

            for (var i = 0; i < inferenceData.Inferences.length; i++) {
                var inferenceResults = inferenceData.Inferences[i];
                var j = 1;
                while (inferenceResults[j] != undefined) {
                    if (inferenceResults[j].P >= threshold) {

                        if (updateCanvas) {
                            DrawBoundingBox(inferenceResults[j], canvasOverlay, threshold, 1, 1);
                        }

                        var iou = calcIoU(inferenceResults[j].X, inferenceResults[j].Y, inferenceResults[j].x, inferenceResults[j].y);

                        if (iou >= iouThreshold) {

                            if (iouStart == null) {
                                iouStart = getDate(inferenceResults['T']);
                            } else {
                                var dateNow = getDate(inferenceResults['T']);
                                var delta = Math.abs(dateNow - iouStart);

                                if ((delta / 1000) >= notificationThreshold) {
                                    var chartDiv = document.getElementById('barChartDiv');

                                    if (chartDiv.classList.contains("alertBlink") == false) {
                                        chartDiv.classList.add("alertBlink");
                                        var navbarNotificationSpan = document.getElementById("navbarNotificationSpan");
                                        var navbarAlertHeader = document.getElementById("navbarAlertHeader");
                                        var navbarAlertSpan = document.getElementById("navbarAlertSpan");

                                        var currentValue = 0;

                                        if (navbarNotificationSpan.innerHTML.length > 0) {
                                            currentValue = parseInt(navbarNotificationSpan.innerHTML);
                                        }
                                        currentValue += 1;
                                        navbarNotificationSpan.innerHTML = currentValue.toString();
                                        navbarAlertHeader.innerHTML = `${currentValue.toString()} alert`;

                                        navbarAlertSpan.innerHTML = `${dateNow.toLocaleString('en-US')}`;
                                    }
                                }
                            }
                            p_value++;
                        }
                    }
                    j++;
                }
            }

            if (p_value == 0) {
                var chartDiv = document.getElementById('barChartDiv');
                if (chartDiv.classList.contains("alertBlink") == true) {
                    chartDiv.classList.remove("alertBlink");
                }
                iouStart = null;
            }
            barChart.data.datasets[0].data.push(p_value);
            barChart.update();

        } catch (err) {
            console.error("Error processing Telemetry data for chart ");
        }
    }
}

// process SignalR message for Cosmos DB
async function processCosmosDbMessage(signalRMsg, threshold) {
    var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

    if (captureInProgress == true) // use blob for image capture
    {
        return;
    }

    if (pendingImagePath.length == 0) {
        // Images are not captured, inference results only.  Nothing to do.
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

            var imageUrl = `${imagePath[1]}/${imagePath[2]}/${imagePath[3]}/${message.inferenceResults[inferenceResult].T}.jpg`;
            await CheckImageForInference(currentDeviceId, imageUrl, message.inferenceResults[inferenceResult].inferenceResults, threshold);
        }

    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
    }
}

// process SignalR message for Blob
// Use this for image capture (not inference)
async function processBlobMessage(signalRMsg) {

    var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

    if (captureInProgress == false || pendingImagePath.length == 0) {
        //printTime(`Skipping ${signalRMsg} ${captureInProgress} ${pendingImagePath}`);
        return;
    }

    // stop processing more messages;
    captureInProgress = false;
    console.debug(`Processing ${signalRMsg}`)

    var imagePath = pendingImagePath.split("/");

    if (imagePath.length != 4) {
        console.error(`pendingImagePath unexpected format ${pendingImagePath}`)
        return;
    }

    try {
        var message = JSON.parse(signalRMsg);
        // blob message format
        // <device id>/<image format JPG or BMP>/<Folder - timestamp >/<File Name>
        // e.g. 7c9ebd92cc24/JPG/20220916202631610/20220916203339045.jpg
        //
        // Pending Image Path format
        // iothub-link/<device id>/<image format>/<Folder>
        // e.g. iothub-link/7c9ebd92cc24/JPG/20220916203416261

        var blobPath = message.blobPath.split("/");

        if ((imagePath[1] == currentDeviceId) && (blobPath[0] == imagePath[1]) && (blobPath[1] == imagePath[2]) && (blobPath[2] == imagePath[3])) {

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

                    // Found an image, stop capture
                    capture_photo_url = message.blobPath;
//                    pendingImagePath = '';
                    StopInference('captureImageBtnResult', true);
                }
            }).fail(function (response, status, err) {
                console.error(`home/GetImagesFromBlob : error : ${err}`);
                captureInProgress = true;
            });
        } else {
            console.debug(`Image Path not match Panding Path : ${pendingImagePath}`);
            captureInProgress = true;
        }
    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`);
        captureInProgress = true;
    }
}

// Checks image in Blob Storage and display it.
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
            if (isZoneDetectionRunning == true) {
                canvasId = 'zoneDetectionCanvas';
                overlayCanvsId = 'zoneDetectionCanvasOverlay';
            }
            else {
                canvasId = 'captureImageCanvas';
                overlayCanvsId = 'captureImageCanvasOverlay';
            }

            var json = JSON.parse(response.value);
            var canvasImage = document.getElementById(canvasId);
            var ctxImage = canvasImage.getContext('2d');
            var canvasOverlay = document.getElementById(overlayCanvsId);
            var ctxOverlay = canvasOverlay.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                ctxOverlay.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);
                ctxImage.clearRect(0, 0, canvasImage.width, canvasImage.height);
                ctxImage.globalCompositeOperation = 'source-over';
                ctxImage.drawImage(img, 0, 0, canvasImage.width, canvasImage.height);

                ratio_x = canvasImage.width / img.width;
                ratio_y = canvasImage.height / img.height;

                if (inferenceResults != null) {

                    for (var i = 0; i < inferenceResults.length; i++) {
                        data = inferenceResults[i];

                        // Draw a bounding box if P is above threshold
                        //console.debug(`>> Threashold ${threshold} P ${data.P}`)
                        if (data.P >= threshold) {
                            DrawBoundingBox(data, canvasOverlay, threshold, ratio_x, ratio_y);
                        }
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
        console.error(`${funcName} : ${err.statusText}`)
    } finally {
    }

    return found;
}

// Draw bounding box and add annotation
function DrawBoundingBox(data, canvasOverlay, threshold, offset_x, offset_y) {

    var funcName = `${arguments.callee.name}()`;
    //console.debug(`=> ${funcName}`);

    var ctxOverlay = canvasOverlay.getContext('2d');

    // console.debug(`>> Threashold ${threshold} P ${data.P}`)

    ctxOverlay.font = '12px serif';
    ctxOverlay.lineWidth = 1;
    ctxOverlay.textBaseline = "bottom";
    ctxOverlay.strokeStyle = "yellow";

    var X = parseInt(data.X * offset_x);
    var Y = parseInt(data.Y * offset_y);
    var x = parseInt(data.x * offset_x);
    var y = parseInt(data.y * offset_y);
    var w = x - X;
    var h = y - Y;

    ctxOverlay.lineWidth = 2;
    ctxOverlay.strokeRect(X, Y, w, h);
    var confidence = `${(data.P * 100).toFixed(1).toString()}%`;
    confidence = `${confidence}`;
    ctxOverlay.lineWidth = 1;
    ctxOverlay.strokeText(confidence, X + 2, y);

    ctxOverlay.textBaseline = "top";
    ctxOverlay.strokeStyle = "lime";
    var iou = calcIoU(data.X, data.Y, data.x, data.y);
    confidence = `${iou}%`;
    ctxOverlay.lineWidth = 1;
    ctxOverlay.strokeText(confidence, X + 2, Y + 2);
}

// A wrapper to start inference.  Used to test parameters.
async function StartInference(resultElementId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)
    var resultElement = document.getElementById(resultElementId);

    try {
        setResultElement(resultElement, `Starting Inference`);
        var frequency = parseInt(document.getElementById("zoneDetectionFrequencySlider").value);
        // to ms, but min 10 sec interval
        frequency = Math.max(10, frequency);
        frequency = Math.round((frequency * 1000) / 33.3);
        var Mode = 1;  // image & inference
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = document.getElementById("zoneDetectionImageCountSlider").value;
        var FrequencyOfImages = Math.max(1, frequency).toString();
        var MaxDetectionsPerFrame = null;
        var NumberOfInferencesPerMessage = null;
        var model_id = document.getElementById("zoneDetectionModelIdList").value;

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

        // call stop just to be certain.
        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'sony/StopUploadRetrainingData',
            data: {
                device_id: currentDeviceId
            }
        });
    }
    return;
}

// Utility function to draw zone rect. For Zone Detection canvas.
function DrawZoneRect(canvasId) {
    // draw bounding box for zone detection
    overlayCanvas = document.getElementById(canvasId);
    overlayCanvasCtx = overlayCanvas.getContext("2d");
    overlayCanvasCtx.strokeStyle = "red";
    overlayCanvasCtx.lineWidth = 3;
    overlayCanvasCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCanvasCtx.globalAlpha = 0.3;
    overlayCanvasCtx.fillStyle = "red";
    overlayCanvasCtx.fillRect(rect_zone[0], rect_zone[1], (rect_zone[2] - rect_zone[0]), (rect_zone[3] - rect_zone[1]));
}

// A wrapper function to start Zone Detection
async function StartZoneDetection(resultElementId, withImage) {
    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)
    var resultElement = document.getElementById(resultElementId);
    var bStarted = false;

    try {
        setResultElement(resultElement, `Starting Zone Detection Inference`);
        var frequency = parseInt(document.getElementById("zoneDetectionFrequencySlider").value);
        frequency = Math.max(1, Math.round((frequency * 1000) / 33.3));
        var model_id = currentModelId;
        var NumberOfInferencesPerMessage = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;

        ClearZoneDetectionCanvas();

        if (withImage == true) {
            // Image & Inference results
            var Mode = 1; // Image & Inference results
            var FileFormat = null;
            var NumberOfImages = 0; // continuous
            var FrequencyOfImages = Math.max(frequency, Math.round(10000 / 33.3)).toString();
            var MaxDetectionsPerFrame = null;

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
                    // draw bounding box for zone detection
                    DrawZoneRect('zoneDetectionCanvasZoneOverlay');
                    bStarted = true;
                }
                else {
                    setResultElement(resultElement, `Failed to start : ${result.result}`);
                }
            }).fail(function (response, status, err) {
                setResultElement(resultElement, `Failed to start : ${response.responseJSON.value}`);
                console.error(`${funcName}: ${response.responseJSON.value}`)
            });
        }
        else {
            // No image.  Inference results only.
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
                setResultElement(resultElement, `Processing Telemetry`);
                // draw bounding box for zone detection
                DrawZoneRect('zoneDetectionCanvasZoneOverlay');
                bStarted = true;
            }).fail(function (response, status, err) {
                setResultElement(resultElement, `Failed to start : ${response.responseJSON.value}`);
                console.error(`${funcName}: ${response.responseJSON.value}`)
            });
        }

    } catch (err) {
        console.error(`${funcName}: ${err.statusText}`)
    }
    return bStarted;
}

// A wrapper function to stop inference
async function StopInference(resultElementId, withImage) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName} : Image ${withImage}`)
    var resultElement = undefined;
    var bStopped = false;
    pendingImagePath = '';

    if (resultElementId != undefined) {
        resultElement = document.getElementById(resultElementId);
    }

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
                        setResultElement(resultElement, `Stopped`);
                        bStopped = true;
                    }
                }
            }
        }).then(function (response, textStatus, jqXHR) {
            if (resultElementId != undefined) {
                setResultElement(resultElement, `Stopped (Status = ${jqXHR.status})`);
            }
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

// A wrapper function to save parameters to cookie.
async function SaveParameterToCookie() {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    await $.ajax({
        async: true,
        type: "POST",
        url: window.location.origin + '/' + 'ZoneDetection/SaveParameters',
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

// Calculate IoU
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
        coverage = ((areaIntersect * 1.0) / areaInference);
        coverage = (coverage * 100.0).toFixed(1);
    }

    //console.debug(`-- IoU ${iou} coverage ${coverage}`);
    return coverage;
}

// Sets Device List and Model List selected items.
// Called if Device ID and Model ID are retrieved from cookie
async function SetDeviceLists(deviceId, modelId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    var deviceListId = 'captureDeviceIdList'
    var resultElementId = 'captureImageBtnResult';

    try {
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
                    });
            })
            .catch((err) => {
                console.error(`${funcName}: ${err.statusText}`)
            });

        var deviceListId = 'zoneDetectionDeviceIdList'
        var resultElementId = 'startZoneDetectionBtnResult';
        await GetDevices(deviceListId, true, false, 'Select Device', '0', resultElementId)
            .then(async function (response) {
                document.getElementById(deviceListId).value = deviceId;

                var modelListId = 'zoneDetectionModelIdList';
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
                    });

            })
            .catch((err) => {
                console.error(`${funcName}: ${err.statusText}`)
            });
    } finally {
        // toggleLoader(false);
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


