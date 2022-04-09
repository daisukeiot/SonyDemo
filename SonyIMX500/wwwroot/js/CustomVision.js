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
            var option = new Option("Select from list", null);
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

async function DeleteCustomVisionProject(projectId) {

    try {

        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.href + 'customvision/DeleteProject',
            data: {projectId:projectId},
        });

        AddApiOutput(result.value);

        var json = JSON.parse(result.value);

        json.forEach(project => {
            list.append(new Option(project.name, project.name));
        });
        console.log(json)
        for (var project in json.project) {
            console.log(project)
            for (var project in json.models[model].projects) {
                list.append(new Option(json.models[model].projects[project].model_project_name, json.models[model].projects[project].model_project_name));
            }
        }
    } catch (err) {
        alert("GetModels() : Error (" + err.status + ") " + err.statusText);
    }
}