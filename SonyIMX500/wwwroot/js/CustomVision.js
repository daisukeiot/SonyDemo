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

function CvGetProjectId() {

    var projectList = document.getElementById('cvProjectList');
    var projectId = null;

    if (isItemSelected('cvProjectList', null)) {
        projectId = projectList[projectList.selectedIndex].value;
    }
    return projectId;
}

async function CvGetProjects(listElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    try {

        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'customvision/GetProjects',
            data: {},
            success: function (result) {
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
                }
            },
            error: function (response, status, error) {
                console.error(err);
                alert(funcName + " Error " + status);
            }
        });
    } catch (err) {
    } finally {
    }
}

async function CvGetTags(projectId, listElementId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    try {

        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'customvision/GetTags',
            data: { projectId : projectId},
            success: function (result) {
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
                        var option = new Option(tag.name, tag.name)
                        option.setAttribute('data-tagid', tag.id);
                        list.append(option);

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
            },
            error: function (response, status, error) {
                console.error(err);
                alert(funcName + " Error " + status);
            }
        });
    } catch (err) {
    } finally {
    }
}

async function CvCreateTag(projectId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    try {
        var tagName = document.getElementById("cvCreateTagName").value;
        var tagDesc = document.getElementById("cvCreateTagDesc").value;

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'customvision/CreateTag',
            data: {
                projectId: projectId,
                tagName: tagName,
                desc: tagDesc
            },
            success: function (result) {
            },
            error: function (response, status, error) {
                console.error(err);
                alert(funcName + " Error " + status);
            }
        });
    } catch (err) {
    } finally {
    }
}

async function CvAssignRegion(projectId, tagId) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    try {
        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'customvision/CreateImageRegion',
            data: {
                projectId: projectId,
                imageId: selectedItem.Id,
                tagId: tagId,
                proposals: JSON.stringify(selectedItem.Proposals)
            },
            success: function (result) {

                selectedItem.Regions = selectedItem.Proposals;

                cvJsGridData = $("#cvImageJsGrid").jsGrid("option", "data");    
                $.each(cvJsGridData, function (index, value) {

                    if (value.Id == selectedItem.Id) {
                        value["Regions"] = value["Proposals"];
                        // Update grid entry
                        $(cvImageJsGrid).jsGrid("updateItem", value, value);
                        // Trigger click to refresh preview window
                        $(cvImageJsGrid).jsGrid("rowByItem", value).trigger("click");
                    }
                });
            },
            error: function (response, status, error) {
                alert(funcName + " Error " + status);
                console.error(err);
            },
        });

    } catch (err) {
    } finally {
    }
}

async function CvDeleteProject(project_name) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    var resultElement = document.getElementById('deleteCustomVisionProjectBtnResult');

    try {

        await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.origin + '/' + 'customvision/DeleteProject',
            data: { project_name: project_name},
            success: function (result) {
                resultElement.innerHTML = "Success";
            },
            error: function (response, status, error) {
                console.error(err);
                alert(funcName + " Error " + status);
            }
        });

    } catch (err) {
        alert(funcName + ": Error (" + err.status + ") " + err.statusText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : err.responseText;
    }
}

async function CvTrainProject(resultElement) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    var resultElement = document.getElementById('cvStartTrainingBtnResult');

    try {

        var projectId = CvGetProjectId();

        if (projectId != null) {
            await $.ajax({
                    async: true,
                    type: "POST",
                    url: window.location.origin + '/' + 'customvision/TrainProject',
                    data: { projectId: projectId },
                    success: function (response) {
                        resultElement.innerHTML = "Success";
                    },
                    error: function (response, status, error) {
                        console.error(response);
                        alert(funcName + " Error " + response.responseJSON ? response.responseJSON.data : response.responseText);
                    }
            });
        }
    } catch (err) {
        //alert(funcName + " : Error (" + err.status + ") " + err.statusText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.data : err.responseText;
    }
}

$("#cvImageJsGrid").jsGrid({
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
                    projectId: document.getElementById("cvProjectId").value
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done(function (response) {
                d.resolve(JSON.parse(response.value));
                $(cvImageJsGrid).jsGrid("sort", { field: "ResizedImageUri", order: "desc" });
            });

            return d.promise();
        }
    },
    onItemUpdated: function (item) {
        console.log("Updated");
    },
    fields: [
        {
            name: "ResizedImageUri",
            title: "Image",
            itemTemplate: function (val, item) {
                return $("<img>").attr("src", val).css({ "max-height": "80px", "max-width": "80px", "object-fit": "contain" });
            },
            align: "center",
            width: "85px",
            height: "82px"
        },
        {
            name: "Width", title:"W", type: "number", align: "left", width: "4em"
        },
        {
            name: "Height", title:"H", type: "number", align: "left", width: "4em"
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
        CvPreviewPhoto(args.item);
    },
});

function CvPreviewPhoto(item) {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

    var canvas = document.getElementById("cvImageCanvas");
    canvas.setAttribute("data-imageId", item.Id);
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = item.ResizedImageUri;
    img.onload = function () {
        canvas.width = item.Width * (canvas.width / item.Width);
        canvas.height = (canvas.width * item.Height) / item.Width;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        ctx.lineWidth = 3
        ctx.strokeStyle = "rgb(255, 255, 0)"
        ctx.font = '15px serif';
        ctx.fillStyle = "rgb(255, 255, 0)"
        ctx.textBaseline = "top";

        if (item.Regions.length > 0) {
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

        selectedItem = item;

    }
}

function CvUploadImage() {
    var funcName = arguments.callee.name + "()";
    console.debug("=>", funcName);

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
}