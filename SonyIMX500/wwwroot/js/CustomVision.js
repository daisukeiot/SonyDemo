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
                list.append(new Option(tag.name, tag.id));
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
        var tagName = document.getElementById("createTagName").value;
        var tagDesc = document.getElementById("createTagDesc").value;

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
    height: "400",

    loadIndication: false,
    inserting: false,
    editing: false,
    filtering: false,
    sorting: true,
    paging: true,
    autoload: false,
    loadMessage: "Please, wait...",
    controller: {
        loadData: function (filter) {
            var d = $.Deferred();
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
                $("#blobCvImageJsGrid").jsGrid("sort", { field: "Uri", order: "desc" });
            });

            return d.promise();
        }
    },

    fields: [
        {
            name: "Uri",
            text: "Image",
            itemTemplate: function (val, item) {
                return $("<img>").attr("src", val).css({ height: "120px" }).on("click", function () {
                    $("#imagePreview").attr("src", item.Uri);
                    console.log(item.Uri)
                });
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
            name: "Regions", type: "text", align: "left", width: "auto"
        },
        {
            name: "Proposal", type: "text", align: "left", width: "auto"
        },
        {
            name: "Tags", type: "text", align: "left", width: "auto"
        }
    ],

    rowClick: function (args) {
        $("#imagePreview").attr("src", args.item.Image);
    },
});