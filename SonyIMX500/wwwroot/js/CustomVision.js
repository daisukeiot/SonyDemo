function isItemSelected(selectElement, value) {
    if (document.getElementById(selectElement).selectedIndex == 0) {
        return false;
    } else if (document.getElementById(selectElement).selectedIndex == -1) {
        return false;
    } else if (value && document.getElementById(selectElement).value != value) {
        return false;
    }

    return true;
}

async function GetCustomVisionProjects(listElementId) {
    var funcName = arguments.callee.name + "()";
    var msg;

    try {

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'customvision/GetProjects',
            data: {},
        });

        msg = result.value;

        if (listElementId) {
            var json = JSON.parse(result.value);
            var list = document.getElementById(listElementId);
            var currentSelection = null;

            if (list.selectedIndex != -1) {
                currentSelection = list.value;
            }
            list.innerText = null;
            var option = new Option("Select from list", "");
            option.disabled = true;

            list.append(option);

            json.forEach(project => {
                list.append(new Option(project.name, project.id));
                //list.append(new Option(project.name, project.id));
            });

            list.selectedIndex = 0;

            if (currentSelection) {
                for (var i = 0, len = list.options.length; i < len; i++) {
                    var opt = list.options[i];

                    if (opt.value == currentSelection) {
                        list.value = currentSelection;
                        break;
                    }
                }

            }
            list.blur();
        }
    } catch (err) {
        //msg = processError(funcName, err, true);
    } finally {
        if (msg) {
        //    document.getElementById('tabApiOutput').value = null;
        //    document.getElementById('tabApiOutput').value = msg;
        }
    }
}

async function GetCustomVisionProjectTags(projectId, listElementId) {
    var funcName = arguments.callee.name + "()";
    var msg;

    try {

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'customvision/GetTags',
            data: { projectId : projectId},
        });

        msg = result.value;

        if (listElementId) {
            var json = JSON.parse(result.value);
            var list = document.getElementById(listElementId);
            var currentSelection = null;

            if (list.selectedIndex != -1) {
                currentSelection = list.value;
            }
            list.innerText = null;
            var option = new Option("Select from list", "");
            option.disabled = true;

            list.append(option);

            json.forEach(tag => {
                list.append(new Option(tag.name, tag.name));
                list.setAttribute("tagId", tag.Id);
            });

            list.selectedIndex = 0;

            if (currentSelection) {
                for (var i = 0, len = list.options.length; i < len; i++) {
                    var opt = list.options[i];

                    if (opt.value == currentSelection) {
                        list.value = currentSelection;
                        break;
                    }
                }

            }
            list.blur();
        }
    } catch (err) {
        // msg = processError(funcName, err, true);
    } finally {
        if (msg) {
        //    document.getElementById('tabApiOutput').value = null;
        //    document.getElementById('tabApiOutput').value = msg;
        }
    }
}

async function CustomVisionCreateTag(projectId) {
    var funcName = arguments.callee.name + "()";
    var msg;

    try {
        var tagName = document.getElementById("cvCreateTagName").value;
        var tagDesc = document.getElementById("cvCreateTagDesc").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'customvision/CreateTag',
            data: {
                projectId: projectId,
                tagName: tagName,
                desc: tagDesc
            },
        });

        msg = result.value;

    } catch (err) {
        // msg = processError(funcName, err, true);
        console.error(err);
    } finally {
        if (msg) {
            console.debug(msg);
            //    document.getElementById('tabApiOutput').value = null;
            //    document.getElementById('tabApiOutput').value = msg;
        }
    }
}

async function DeleteProjectCV(project_name) {

    var resultElement = document.getElementById('deleteCustomVisionProjectBtnResult');

    try {

        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.origin + '/' + 'customvision/DeleteProject',
            data: { project_name: project_name},
        });

        resultElement.innerHTML = "Success";

    } catch (err) {
        alert("DeleteProject() : Error (" + err.status + ") " + err.statusText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}

async function TrainProject(project_name) {

    var resultElement = document.getElementById('deleteCustomVisionProjectBtnResult');

    try {

        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.origin + '/' + 'customvision/TrainProject',
            data: { project_name: project_name },
        });

        resultElement.innerHTML = "Success";

    } catch (err) {
        alert("DeleteProject() : Error (" + err.status + ") " + err.statusText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}

$("#blobCvImageJsGrid").jsGrid({
    width: "100%",
    height: "50vh",

    loadIndication: true,
    loadIndicationDelay: 500,
    loadShading: true,
    shrinkToFit: true,
    multiselect: true,
    inserting: false,
    //editing: false,
    filtering: false,
    sorting: true,
    paging: true,
    autoload: false,
    allowSelection: true,
    selectionSettings: { persistSelection: true },
    pageSize: 5,
    loadMessage: "Fetching Training Images...",
    controller: {
        loadData: function (filter) {
            var d = $.Deferred();
            currentImageId = null;
            $.ajax({
                type: "GET",
                url: window.location.origin + '/' + 'customvision/GetImages',
                data: {
                    projectId: document.getElementById("projectId").value
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done(function (response) {
                d.resolve(JSON.parse(response.value));
                $("#blobCvImageJsGrid").jsGrid("sort", { field: "ResizedImageUri", order: "desc" });
            });

            return d.promise();
        }
    },
    fields: [
        //{
        //    name: "Married", title: "Select", sorting: false,
        //    itemTemplate: function (value, item) {
        //        return $("<input>").attr("type", "checkbox")
        //            .attr("checked", value || item.Checked)
        //            .on("change", function () {
        //                item.Checked = $(this).is(":checked");
        //            });
        //    }
        //},
        {
            name: "ResizedImageUri",
            text: "Image",
            itemTemplate: function (val, item) {
                return $("<img>").attr("src", val).css({ height: "80px" });
            },
            align: "center",
            width: "10vw"
        },
        {
            name: "Width", type: "number", align: "left", width: "3vw"
        },
        {
            name: "Height", type: "number", align: "left", width: "3vw"
        },
        {
            name: "Regions", type: "text", align: "left", width: "auto",
            itemTemplate: function (val, item) {
                return JSON.stringify(item.Regions);
            }
        },
        {
            name: "Proposals", type: "text", align: "left", width: "auto",
            itemTemplate: function (val, item) {
                return JSON.stringify(item.Proposals);
            }
        },
        {
            name: "Tags", type: "text", align: "left", width: "auto"
        },
        {
            name: "Id", type: "text", align: "left", width: "auto", visible: false, width: 0
        }
    ],
    rowClick: function (args) {
        console.log("rowClick ", args)
        viewPhotoCv(args.item);
    },
});

function viewPhotoCv(item) {
    console.log(item)
    //$("#cvImagePreview").attr("src", item.ThumbnailUri);

    var canvas = document.getElementById("cvImageCanvas");
    canvas.setAttribute("imageId", item.Id);
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = item.ResizedImageUri;
    img.onload = function () {
        canvas.width = item.Width * (canvas.width / item.Width);
        canvas.height = (canvas.width * item.Height) / item.Width;
        //canvas.hight = item.Height * (canvas.width / item.Width);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        ctx.lineWidth = 3
        ctx.strokeStyle = "rgb(255, 255, 0)"
        ctx.font = '15px serif';
        ctx.fillStyle = "rgb(255, 255, 0)"
        ctx.textBaseline = "top";

        if (item.Regions.length > 0) {
            //var regions = JSON.parse(item.Regions);
            ctx.strokeStyle = "rgb(57, 255, 20)"
            item.Regions.forEach((region) => {
                var x = canvas.width * region.X;
                var y = canvas.height * region.Y;
                var w = canvas.width * region.W - ctx.lineWidth;
                var h = canvas.height * region.H - ctx.lineWidth;
                ctx.strokeRect(x, y, w, h);
            });
            $("#cvAddTagBtn").prop('disabled', true);
        }
        else if (item.Proposals.length > 0) {
            //var proposals = JSON.parse(item.Proposals);

            ctx.strokeStyle = "rgb(255, 0, 0)"
            item.Proposals.forEach((proposal) => {
                var x = canvas.width * proposal.X;
                var y = canvas.height * proposal.Y;
                var w = canvas.width * proposal.W;
                var h = canvas.height * proposal.H;
                ctx.strokeRect(x, y, w, h);
            });
            $("#cvAddTagBtn").prop('disabled', false);
        }
        else {
            $("#cvAddTagBtn").prop('disabled', true);
        }

        if (item.Tags) {
            $('#customVisionTagList').val(item.Tags).trigger('change');
        }
        else {
            $("#customVisionTagList")[0].selectedIndex = 0;
        }

    }
}

function viewPhotoWithRegionProposal(item) {
    var eventId = item.attributes.getNamedItem('eventId').nodeValue;
    console.log("viewPhoto " + eventId);
    var funcName = arguments.callee.name + "()";
    var preElementId = "pre-" + eventId;
    var preElement = document.getElementById(preElementId);
    var dataObj = JSON.parse(preElement.textContent);

    try {
        toggleLoader(false);

        GetImage(dataObj.DeviceID, dataObj.Inferences[0].T)
            .then((result) => {

                if (result) {

                    var json = JSON.parse(result);
                    var canvas = document.getElementById("photoCanvas");
                    var ctx = canvas.getContext('2d');
                    var img = new Image();
                    img.src = json.uri;
                    img.onload = function () {
                        ctx.drawImage(img, 0, 0)
                        ctx.lineWidth = 3
                        ctx.strokeStyle = "rgb(255, 255, 0)"
                        ctx.font = '15px serif';
                        ctx.fillStyle = "rgb(255, 255, 0)"
                        ctx.textBaseline = "top";

                        var preJson = JSON.parse(preElement.innerText);
                        console.log(preJson);
                        for (var inference in preJson.Inferences) {
                            for (var inferenceItem in preJson.Inferences[inference]) {
                                var item = preJson.Inferences[inference][inferenceItem];

                                console.log(item);
                                ctx.strokeRect(item.X, item.Y, item.x - item.X, item.y - item.Y);

                                var p_String = Number(item.P).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 1 });
                                ctx.fillText(p_String, item.X + 5, item.Y + 5);
                            }
                        }
                    }
                    //console.log(result)
                }
            })
            .finally(() => {
                toggleLoader(false);
                var modal = document.getElementById("modalPhoto");
                modal.style.display = "block";
            });

    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
        toggleLoader(true);
    }
}

function uploadImagesSubmit() {
    var funcName = arguments.callee.name + "()";
    console.debug(funcName);

    var msg;

    try {
        var files = document.getElementById("exampleInputFile").files;
        var projectId = document.getElementById("projectId").value;
        var formData = new FormData();
        //var url = window.location.origin + '/' + 'customvision/uploadimagesasync';
        var url = 'uploadimagesasync';
        formData.append("projectId", projectId);
        for (var i = 0; i != files.length; i++) {
            formData.append("images", files[i]);
        }
        $.ajax({
            async: false,
            type: "POST",
            processData: false,
            contentType: false,
            url: url,
            data: formData,
            success: function (repo) {
                if (repo.status == "success") {
                    alert("File : " + repo.filename + " is uploaded successfully");
                }
            },
            error: function () {
                alert("Error occurs");
            }
        });
    } catch (err) {
        // msg = processError(funcName, err, true);
        console.error(err);
    } finally {
        if (msg) {
            console.debug(msg);
            //    document.getElementById('tabApiOutput').value = null;
            //    document.getElementById('tabApiOutput').value = msg;
        }
    }
}

function resizeCanvas(e) {
    var imageCanvas = document.getElementById("cvImageCanvas");
    var parentDiv = document.getElementById("cvImagePreviewDiv");
    //imageCanvas.width = parentDiv.clientWidth;
    //imageCanvas.height = parentDiv.clientHeight;
    //draw(imageCanvas);
}