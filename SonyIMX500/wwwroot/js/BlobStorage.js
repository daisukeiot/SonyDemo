async function GetImage(deviceId, timeStamp) {

    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);
    var msg = null;
    var image = null;

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'home/FindImagesFromBlob',
            data: {
                deviceId: deviceId,
                timeStamp : timeStamp
            }
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }
                
        if (result != null) {
            msg = result.value;
            image = result.value;
        }

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            //setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }

    return image;
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

$("#blobStorJsGrid").jsGrid({
    width: "100%",
    height: "400",

    loadIndication: false,
    inserting: false,
    editing: false,
    filtering: true,
    sorting: true,
    paging: true,
    autoload: false,
    loadMessage: "Please, wait...",
    controller: {
        loadData: function (filter) {
            toggleLoader(false);
            var d = $.Deferred();
            $.ajax({
                type: "GET",
                url: window.location.origin + '/' + 'home/GetAllImagesFromBlob',
                data: {
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done(function (response) {
                d.resolve(JSON.parse(response.value));
                $("#blobStorJsGrid").jsGrid("sort", { field: "CreateDate", order: "desc" });
                toggleLoader(true);
            });

            return d.promise();
        }
    },

    fields: [
        {
            name: "Image",
            text: "Image",
            itemTemplate: function (val, item) {
                return $("<img>").attr("src", val).css({ height: "120px", width: "120px" }).on("click", function () {
                    $("#imagePreview").attr("src", item.Image);
                    console.log(item.Image)
                });
            },
            align: "left",
            width: "auto"
        },
        {
            name: "CreateDate", type: "text", align: "left", width: "auto"
        },
        {
            name: "DeviceId", type: "text", align: "left", width: "auto"
        },
        {
            name: "FileName", type: "text", align: "left", width: "auto"
        },
        { type: "control" }
    ],

    rowClick: function (args) {
        $("#imagePreview").attr("src", args.item.Image);
    },
});

var imagerenderer = function (item, value) {
    console.log(value)
    return '<img src=value.Image />';
}

