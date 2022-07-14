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

var region = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};
var offsetX;
var offsetY;

function initCanvas(canvasId) {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "green";
    ctx.lineWidth = 3;

    var $canvas = $('#' + canvasId);
    var canvasOffset = $canvas.offset();
    offsetX = canvasOffset.left;
    offsetY = canvasOffset.top;

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
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

    var x = region.x.toString();
    var y = region.y.toString();
    $('#region_x').html(x.padStart(3, ' '));
    $('#region_y').html(y.padStart(3, ' '));

    var w = (region.x + region.w).toString();
    var h = (region.y + region.h).toString();

    $('#region_w').html(w.padStart(3, ' '));
    $('#region_h').html(h.padStart(3, ' '));

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
    //console.debug("=>", funcName);

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

async function CaptureSingleImage() {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName)
    var startStart = Date.now();

    try {
        var device_id = document.getElementById("safetyDetectionDeviceIdList").value;
        var Mode = 0;
        var FileFormat = null;
        var CropHOffset = null;
        var CropVOffset = null;
        var CropHSize = null;
        var CropVSize = null;
        var NumberOfImages = 1
        var FrequencyOfImages = 1;
        var MaxDetectionsPerFrame = null;
        var NumberOfInferencesPerMessage = null;
        var model_id = document.getElementById("safetyDetectionModelIdList").value;

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
    } finally {
    }
    return ret;
}

// process SignalR message for Blob
async function processBlobMessage(signalRMsg) {

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
            var canvas = document.getElementById("captureImageCanvasOverlay");
            var ctx = canvas.getContext('2d');
            var img = new Image();
            img.src = json.uri;
            img.onload = function () {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            pendingImagePath = '';
        });
    } catch (err) {
    } finally {
    }
    
}