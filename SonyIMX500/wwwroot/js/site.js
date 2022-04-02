const loginRequest = {
    scopes: ["User.Read"]
}

const defaultClientId = '6b8bbe61-f6e0-4490-ba1e-c65665741629';

let renewTokenRequest
let myMsal;

function initialize() {

    console.debug('initialize()');

    authConfig = {
        auth: {
            clientId: defaultClientId,
            redirectUri: window.location.href + "index.html"
            //redirectUri:"http://localhost:8080/index.html"
        }
    }

    myMsal = new Msal.UserAgentApplication(authConfig);

    renewTokenRequest = {
        scopes: [authConfig.auth.clientId], // here process.env.VUE_APP_CLIENT_ID is my Azure AD application id value
        prompt: 'none',
        authority: null, // I tried also without setting authority to null
        account: myMsal.getAccount() // this one and the authority value I added because of another thread from git with another id token renewal issue
    }

}

function auth() {

    console.debug('auth()');

    if (!myMsal.getAccount()) {
        myMsal.loginRedirect(loginRequest);
    }
}

function getTokens() {
    console.debug('getTokens');
    getLoginToken();
    document.getElementById('lastTime').innerHTML = new Date();
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getLoginToken() {

    console.debug('getLoginToken');
    let raw_token = '';

    myMsal.acquireTokenSilent(renewTokenRequest)
        .then(function (response) {
            console.log("acquireTokenSilent succeed.");
            console.log(response.idToken);

            if (response != undefined) {
                document.getElementById('idToken').value = response.idToken.rawIdToken;
                console.log('id Record time:' + String(expiresOn));
                console.log('id Expire time:' + String(response.expiresOn));

                if (String(expiresOn) !== String(response.expiresOn)) {
                    expiresOn = response.expiresOn;
                    document.getElementById('idExpire').innerHTML = String(response.expiresOn);
                }

                PostToken(response.idToken.rawIdToken);
                sleep(2000);
                GetDevices();
            }

            return response.idToken.rawIdToken;
        })
        .catch((error) => {
            document.getElementById('idToken').value = error.errorMessage;
            console.log(error.errorMessage);

            if (error.errorMessage.indexOf("User login is required") !== -1) {
                auth();
            }
            else if (error.errorMessage.indexOf("interactive") !== -1) {
                myMsal.acquireTokenRedirect(renewTokenRequest);
            } else {
                console.log(error);
                return '';
            }
        });
}

function renewAuthConfig() {
    var clientId = document.getElementById('clientId').value;

    authConfig = {
        auth: {
            clientId: defaultClientId,
            redirectUri: window.location.href + "index.html"
            //redirectUri: "http://localhost:8080/index.html"
        }
    }



    myMsal = new Msal.UserAgentApplication(authConfig);
    getTokens();
}

function PostToken(token) {
    console.log("PostToken() : " + token);

    $.ajax({
        type: "POST",
        url: window.location.href + 'sony/PostToken',
        data: { token: token },
        success: function (response) {
            console.log(response)
        },
        error: function (req, status, error) {
            alert("PostToken Error " + status);
        }
    });
}

async function GetDevices() {

    PostToken(document.getElementById('idToken').value);

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDevices',
            data: {}
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        var json = JSON.parse(result.value);

        var list = document.getElementById("idDevices");
        list.innerText = null;
        list.append(new Option("", 0));

        for (var device in json.devices) {
            list.append(new Option(json.devices[device].device_id, json.devices[device].device_id))
        }

    } catch (err) {
        alert("GetDevices() : Error (" + err.status + ") " + err.statusText);
    }
}

async function GetDevice(deviceId) {

    try {

        var txtOutput = document.getElementById('txtGetDevice');
        txtOutput.value = "";

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDevice',
            data: { device_id: deviceId },
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        var json = JSON.parse(result.value);
        txtOutput.value = JSON.stringify(json, null, 2);

        var list = document.getElementById("deviceModels");
        list.innerText = null;
        list.append(new Option("", 0));

        for (var model in json.models) {
            list.append(new Option(json.models[model].model_version_id, json.models[model].model_version_id))
        }

    } catch (err) {
        alert("GetDevice() : Error (" + err.status + ") " + err.statusText);
    }
}

async function GetModels(model_id) {

    try {

        var txtOutput = document.getElementById('txtModel');
        txtOutput.value = "";

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetModels',
            data: { model_id: model_id },
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        var json = JSON.parse(result.value);
        txtOutput.value = JSON.stringify(json, null, 2);

        if (model_id != null) {
            document.getElementById('idModel').innerHTML = String(json.models[0].model_id);

            var list = document.getElementById("modelProjects");
            list.innerText = null;
            list.append(new Option("", 0));

            for (var project in json.models[0].projects) {
                list.append(new Option(json.models[0].projects[project].model_project_name, json.models[0].projects[project].model_project_name));
            }
        }

    } catch (err) {
        alert("GetDevice() : Error (" + err.status + ") " + err.statusText);
    }
}

async function GetModelVersion(model_id, project_id, model_version) {

    try {

        var list = document.getElementById("modelVersions");

        if (model_version == null) {
            list.innerText = null;
            list.append(new Option("", 0));
        }

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetBaseModelStatus',
            data: { model_id: model_id },
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        var json = JSON.parse(result.value);
        txtOutput.value = JSON.stringify(json, null, 2);
        console.log(JSON.stringify(json, null, 2));

        for (var project in json.projects) {

            if (json.projects[project].model_project_name == project_id) {
                for (var version in json.projects[project].versions) {

                    if (model_version == null) {
                        list.append(new Option(json.projects[project].versions[version].version_number, json.projects[project].versions[version].version_number))
                    }
                    else if (json.projects[project].versions[version].version_number == model_version) {
                        document.getElementById("modelStage").innerHTML = json.projects[project].versions[version].stage;
                        document.getElementById("modelResult").innerHTML = json.projects[project].versions[version].result;
                    }
                }
            }
        }
    } catch (err) {
        alert("GetDevice() : Error (" + err.status + ") " + err.statusText);
    }
}


function RebootDevice(deviceId) {

    PostToken(document.getElementById('idToken').value);

    $.ajax({
        type: "POST",
        url: window.location.href + 'sony/RebootDevice',
        data: { deviceId: deviceId },
        success: function (response) {
            alert("Reboot " + response);
        },
        error: function (req, status, error) {
            alert("Error " + status);
        }
    });
}

function GetFirmwares(deviceId) {

    PostToken(document.getElementById('idToken').value);

    $.ajax({
        type: "GET",
        url: window.location.href + 'sony/GetFirmwares',
        data: {},
        success: function (response) {
            var json = JSON.parse(response.value);
            console.log(JSON.stringify(json, null, 2));
            //document.getElementById('txtGetDevice').value = JSON.stringify(json, null, 2);
            document.getElementById("firmwareMCU").innerText = null;
            for (var mcu in json.MCUs) {
                for (var version in json.MCUs[mcu].versions) {
                    document.getElementById("firmwareMCU").append(new Option(json.MCUs[mcu].versions[version].version_number, json.MCUs[mcu].versions[version].version_number))
                }
            }

            document.getElementById("firmwareSensor").innerText = null;
            for (var sensor in json.Sensors) {
                for (var version in json.Sensors[sensor].versions) {
                    document.getElementById("firmwareSensor").append(new Option(json.Sensors[sensor].versions[version].version_number, json.Sensors[sensor].versions[version].version_number))
                }
            }

            document.getElementById("firmwareSensorLoader").innerText = null;
            for (var sensorLoader in json.SensorLoaders) {
                for (var version in json.SensorLoaders[sensorLoader].versions) {
                    document.getElementById("firmwareSensorLoader").append(new Option(json.SensorLoaders[sensorLoader].versions[version].version_number, json.SensorLoaders[sensorLoader].versions[version].version_number))
                }
            }
        },
        error: function (req, status, error) {
            alert("Error " + status);
        }
    });
}

async function GetCustomVisionProjects() {

    try {
        var list = document.getElementById("idProject");
        list.innerText = null;
        list.append(new Option("", 0));

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetModels',
            data: {},
        });

        if (result['success'] == false) {
            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
        }

        var json = JSON.parse(result.value);

        for (var model in json.models) {
            for (var project in json.models[model].projects) {
                list.append(new Option(json.models[model].projects[project].model_project_name, json.models[model].projects[project].model_project_name));
            }
        }
    } catch (err) {
        alert("GetDevice() : Error (" + err.status + ") " + err.statusText);
    }
}

function AddToListBox(listBoxId) {

}