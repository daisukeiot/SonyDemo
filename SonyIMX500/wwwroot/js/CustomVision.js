async function GetCustomVisionProjects() {

    try {
        var list = document.getElementById("listCustomVisionProjects");
        list.innerText = null;
        list.append(new Option("", 0));

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'customvision/GetProjects',
            data: {},
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        AddApiOutput(result.value);

        var json = JSON.parse(result.value);

        json.forEach(project => {
            list.append(new Option(project.name, project.id));
        });
    } catch (err) {
        alert("GetModels() : Error (" + err.status + ") " + err.statusText);
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

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

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