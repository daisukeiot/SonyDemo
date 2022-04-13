async function GetCustomVisionProjects(listElementId) {

    try {

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'customvision/GetProjects',
            data: {},
        });

        AddApiOutput('customvision/GetProjects', result.value);

        if (listElementId) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElementId);
            list.innerText = null;
            var option = new Option("Select from list", "");
            option.disabled = true;

            list.append(option);

            json.forEach(project => {
                list.append(new Option(project.name, project.id));
            });

            list.selectedIndex = 0;
            list.blur();
        }

    } catch (err) {
        alert("GetCustomVisionProjects() : Error (" + err.status + ") " + err.statusText);
    }
}

async function DeleteCustomVisionProjectCV(project_name) {

    var resultElement = document.getElementById('deleteCustomVisionProjectResult');

    try {

        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.href + 'customvision/DeleteProject',
            data: { project_name: project_name},
        });

        resultElement.innerHTML = "Success";

    } catch (err) {
        alert("DeleteCustomVisionProject() : Error (" + err.status + ") " + err.statusText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}