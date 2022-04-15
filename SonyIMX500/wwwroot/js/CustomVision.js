async function GetCustomVisionProjects(listElementId) {
    var funcName = arguments.callee.name + "()";
    var msg;

    try {

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'customvision/GetProjects',
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
            });

            if (currentSelection) {
                list.value = currentSelection;
            }
            else {
                list.selectedIndex = 0;
            }
            list.blur();
        }
    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            AddApiOutput(funcName, msg);
        }
    }
}

async function DeleteProjectCV(project_name) {

    var resultElement = document.getElementById('deleteCustomVisionProjectBtnResult');

    try {

        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.href + 'customvision/DeleteProject',
            data: { project_name: project_name},
        });

        resultElement.innerHTML = "Success";

    } catch (err) {
        alert("DeleteProject() : Error (" + err.status + ") " + err.statusText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}