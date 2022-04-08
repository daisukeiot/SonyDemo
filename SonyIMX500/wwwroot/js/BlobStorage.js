
async function GetAllImages() {


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

        AddApiOutput("GetModels", result.value);

        var images  = result.value;

        for (var image in images) {
            var url = new URL(images[image]);
            var pathArray = url.pathname.split('/');
            var sasUrl = images[image] + "?sv=2020-08-04&ss=bfqt&srt=o&sp=r&se=2022-04-29T17:02:31Z&st=2022-04-08T09:02:31Z&spr=https,http&sig=5cUYIuONEqY8CIw8PZDsnVIJvt1XDb%2FUEM3XvFuQDVw%3D";
            addImage(pathArray[2], sasUrl, pathArray[5]);
        }


    } catch (err) {
        alert("GetModels() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
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