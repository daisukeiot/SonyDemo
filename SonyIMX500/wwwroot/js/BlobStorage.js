
async function GetAllImages() {

    var funcName = arguments.callee.name + "()";
    var msg;

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'home/GetAllImagesFromBlob',
            data: {
            }
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        var images  = result.value;
        msg = result.value;

        $('#image_gallery').empty();
        for (var image in images) {
            var url = new URL(images[image]);
            var pathArray = url.pathname.split('/');
            addImage(pathArray[2], images[image], pathArray[5]);
        }
    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            //setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
            console.log("Finish")
        }
    }
}

function addImage(deviceId, image_url, image_file_name) {

    var context = {
        deviceId: deviceId,
        image_url: image_url,
        image_file_name: image_file_name
    };
    var source = document.getElementById('image-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $('#image_gallery').prepend(html);
}