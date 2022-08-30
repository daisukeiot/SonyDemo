let iterationInterval = null;

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

function CvGetIterationProjectId() {

    var projectList = document.getElementById('cvTrainProjectList');
    var projectId = null;

    if (isItemSelected('cvTrainProjectList', null)) {
        projectId = projectList[projectList.selectedIndex].value;
    }
    return projectId;
}

function RefreshIterationGrid() {

    if (iterationInterval != null) {
        clearInterval(iterationInterval);
        iterationInterval = null;
        $('#cvIterationsJsGrid').jsGrid('loadData');
    }
}

async function CvGetProjects(listElementId, resultElementId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);
    var resultElement = null;

    if (listElementId) {
        var list = document.getElementById(listElementId);
        list.disabled = true;

        if (resultElementId != null) {
            resultElement = document.getElementById(resultElementId);
        }
        setResultElement(resultElement, `Retrieving Custom Vision projects`);

        try {

            $('#cvStartTrainingBtn').prop('disabled', false);
            await $.ajax({
                async: true,
                type: "GET",
                url: window.location.origin + '/' + 'customvision/GetProjects',
                data: {},
                success: function (result) {
                    msg = result.value;
                    if (listElementId) {
                        var json = JSON.parse(result.value);
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
                    setResultElement(resultElement, '&nbsp;');
                },
                error: function (response, status, err) {
                    console.error(err);
                    alert(funcName + " Error " + status);
                    setResultElement(resultElement, status);
                }
            });
        } catch (err) {
        } finally {
            list.disabled = false;
        }
    }
}

async function CvGetTags(projectId, listElementId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    if (listElementId) {
        var list = document.getElementById(listElementId);
        list.disabled = true;

        try {
            await $.ajax({
                async: true,
                type: "GET",
                url: window.location.origin + '/' + 'customvision/GetTags',
                data: { projectId: projectId },
                success: function (result) {

                    if (result.length == 0) {
                        var option = new Option("No tags", "");
                        option.disabled = true;
                        list.innerText = null;
                        list.append(option);
                        list.selectedIndex = 0;
                    }
                    else {
                        msg = result.value;

                        var json = JSON.parse(result.value);
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
                    }
                },
                error: function (response, status, err) {
                    console.error(err);
                    alert(funcName + " Error " + status);
                }
            });
        } catch (err) {
        } finally {
            list.disabled = false;
            list.blur();
        }
    }
}

async function CvCreateTag(projectId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

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
            error: function (response, status, err) {
                console.error(err);
                alert(funcName + " Error " + status);
            }
        });
    } catch (err) {
    } finally {
    }
}

async function CvAssignRegion(projectId, tagId) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

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
                        value["Tags"] = $("#cvTagList option:selected").text();
                        // Update grid entry
                        $(cvImageJsGrid).jsGrid("updateItem", value, value);
                        // Trigger click to refresh preview window
                        $(cvImageJsGrid).jsGrid("rowByItem", value).trigger("click");
                    }
                });
            },
            error: function (response, status, err) {
                alert(funcName + " Error " + status);
                console.error(err);
            },
        });

    } catch (err) {
    } finally {
    }
}

async function CvDeleteProject(project_name) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

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
            error: function (response, status, err) {
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
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    var resultElement = document.getElementById('cvStartTrainingBtnResult');

    try {

        var projectId = CvGetIterationProjectId();

        if (projectId != null) {
            await $.ajax({
                    async: true,
                    type: "POST",
                    url: window.location.origin + '/' + 'customvision/TrainProject',
                    data: { projectId: projectId },
                    success: function (result) {
                        resultElement.innerHTML = "Success";
                        $("#cvIterationsJsGrid").jsGrid("loadData");
                    },
                    error: function (response, status, err) {
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
    height: "58vh",

    loadIndication: true,
    loadIndicationDelay: 500,
    loadShading: true,
    shrinkToFit: true,
    multiselect: true,
    editing: false,
    inserting: false,
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
                var array = JSON.parse(response.value);
                array = $.grep(array, function (value) {
                    return (!filter.Tags || value.Tags.toUpperCase().indexOf(filter.Tags.toUpperCase()) > -1);
                });

                d.resolve(array);
                $("#cvImageJsGrid").jsGrid("sort", { field: "ResizedImageUri", order: "desc" });
                $("#cvTagImageCount").html(array.length.toString())
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
                return $("<img>").attr("src", val).css({ "max-height": "75px", "min-height": "75px", "max-width": "80px", "object-fit": "contain" });
            },
            align: "center",
            width: "85px",
            height: "76px",
            sorting: false,
            filtering: false
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
            },
            filtering: false
        },
        {
            name: "Proposals", type: "text", align: "left", width: "auto",
            itemTemplate: function (val, item) {
                return JSON.stringify(item.Proposals);
            },
            filtering: false
        },
        {
            name: "Tags", type: "text", align: "left", width: "auto"
        },
        {
            name: "Id", type: "text", align: "left", width: "auto", visible: false, width: 0, filtering: false
        },
        {
            type: "control", deleteButton: false, editButton: false,
            _createFilterSwitchButton: function () {
                return this._createOnOffSwitchButton("filtering", this.searchModeButtonClass, false);
            }
        }
    ],
    rowClick: function (args) {
        CvPreviewPhoto(args.item);
    },
});

$("#cvIterationsJsGrid").jsGrid({
    width: "100%",
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
    pageSize: 20,
    loadMessage: "Fetching Training Images...",
    controller: {
        loadData: function (filter) {
            var d = $.Deferred();
            var projectId = CvGetIterationProjectId();
            currentImageId = null;
            $.ajax({
                type: "GET",
                url: window.location.origin + '/' + 'customvision/GetIterations',
                data: {
                    projectId: projectId
                },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).done(function (response) {
                var array = JSON.parse(response.value);
                array = $.grep(array, function (value) {
                    return (!filter.Name || value.Name.indexOf(filter.Name) > -1);
                });

                d.resolve(array);
                $("#cvIterationsJsGrid").jsGrid("sort", { field: "Created", order: "desc" });
            });
            return d.promise();
        }
    },
    onItemUpdated: function (item) {
        console.log("Updated");
    },
    fields: [
        {
            name: "Name", type: "text", align: "left", width: "auto", filtering: false,
        },
        {
            name: "Status", type: "text", align: "left", width: "auto",
            itemTemplate: function (val, item) {
                if (val == "Training") {
                    $('#cvStartTrainingBtn').prop('disabled', true);
                    if (iterationInterval == null) {
                        iterationInterval = setInterval(function () { RefreshIterationGrid(); }, 10 * 1000);
                    }
                }
                else if (val == "Completed") {
                }
                else {
                    $('#cvStartTrainingBtn').prop('disabled', false);
                }
                return val;
            }
        },
        {
            name: "Created", type: "text", align: "left", width: "auto", visible: false
        },
        {
            name: "TrainedAt", type: "text", align: "left", width: "auto"
        },
        {
            name: "TrainingType", type: "text", align: "left", width: "auto"
        },
        {
            name: "Precision", type: "text", align: "left", width: "auto"
        },
        {
            name: "Recall", type: "text", align: "left", width: "auto"
        },
        {
            name: "AveratePrecision", type: "text", align: "left", width: "auto"
        },
        {
            type: "control", deleteButton: false, editButton: false,
            headerTemplate: function () {
                return this._createOnOffSwitchButton("filtering", this.searchModeButtonClass, false);
            }
        }
    ],
    rowClick: function (args) {
        CvPreviewPhoto(args.item);
    },
});

function CvPreviewPhoto(item) {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

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
            $('#cvTagList').val(item.Tags).trigger('change');
        }

        selectedItem = item;
    }
}

function CvUploadImages() {
    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    var msg;

    try {
        var files = document.getElementById("cvUploadImages").files;
        var projectId = CvGetProjectId();
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
            success: function (result) {
                alert("File(s) is uploaded successfully");
            },
            error: function (response, status, err) {
                alert(funcName + " Error " + response.responseJSON.value);
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