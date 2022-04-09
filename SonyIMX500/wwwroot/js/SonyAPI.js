let myMsal;
let accessTokenRequest;

authConfig = {
    auth: {
        clientId: document.getElementById('clientId').value,
        redirectUri: window.location.href + "index.html"
    }
}

loginRequest = {
    scopes: ["User.Read"]
}


function sonyApiInitialize() {

    console.debug("sonyApiInitialize()");

    myMsal = new Msal.UserAgentApplication(authConfig);

    accessTokenRequest = {
        scopes: [authConfig.auth.clientId], // here process.env.VUE_APP_CLIENT_ID is my Azure AD application id value
        prompt: 'none',
        authority: null, // I tried also without setting authority to null
        account: myMsal.getAccount() // this one and the authority value I added because of another thread from git with another id token renewal issue
    }

    myMsal.handleRedirectCallback((err, response) => {
        if (err) {
            alert(err);
        } else {
            updateSetupUi(response);
        }
    });
}

function sonyApiAuth() {

    if (!myMsal.getAccount()) {
        myMsal.loginRedirect(loginRequest);
    }
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

function updateSetupUi(tokenResp) {

    console.log("updateSetUi");
    if (tokenResp == null) {
        document.getElementById('taToken').value = "Access Token not found in response.";
        document.getElementById('btnLoginResult').innerHTML = "Access Token not found in response";
    }
    else {
        document.getElementById('taToken').value = tokenResp.idToken.rawIdToken;
        document.getElementById('taToken').dispatchEvent(new Event("change"));
        console.log('id Record time:' + String(expiresOn));
        console.log('id Expire time:' + String(tokenResp.expiresOn));

        if (String(expiresOn) !== String(tokenResp.expiresOn)) {
            expiresOn = tokenResp.expiresOn;
            document.getElementById('spanTokenExpire').innerHTML = String(tokenResp.expiresOn);
        }

        document.getElementById('userName').innerHTML = tokenResp.account.name;
        document.getElementById('userDesc').innerHTML = tokenResp.account.userName;
        document.getElementById('btnLoginResult').innerHTML = "Login Success";
    }
}

function requiresInteraction(errorCode) {
    if (!errorCode || !errorCode.length) {
        return false;
    }
    return errorCode === "consent_required" ||
        errorCode === "interaction_required" ||
        errorCode === "login_required";
}

function getToken() {
    var token = getLoginToken();
    console.log("getLoginToken : " + token);
    document.getElementById('spanTokenLastUpdate').innerHTML = new Date();
    PostToken(token);
    var interval = setInterval(function () { getToken(); }, 300000);
}

async function getLoginToken() {

    console.debug('getLoginToken');
    let tokenResp = null;

    try {
        tokenResp = await myMsal.acquireTokenSilent(accessTokenRequest);
        console.log('### MSAL acquireTokenSilent was successful')
    }
    catch (error) {
        if (requiresInteraction(error.errorCode)) {
            tokenResp = await myMsal.acquireTokenPopup(accessTokenRequest)
            console.log('### MSAL acquireTokenPopup was successful')
        }
        else if (error.errorCode == "user_login_error") {
            if (!myMsal.loginInProgress()) {
                myMsal.loginRedirect(requestObj);
            }
        }
    }

    updateSetupUi(tokenResp);

    return tokenResp.accessToken;
}

function AddApiOutput(apiName, result) {
    var json;

    if (typeof (result) == 'string') {
        json = JSON.parse(result);
    }
    else {
        json = result;
    }
    
    document.getElementById('apiOutputLabel').innerHTML = apiName;
    document.getElementById('taApiOutput').value = null;
    document.getElementById('taApiOutput').value = JSON.stringify(json, null, 2);
}

//async function GetCustomVisionProjects() {

//    try {
//        var list = document.getElementById("listCustomVisionProjects");
//        list.innerText = null;
//        list.append(new Option("", 0));

//        const result = await $.ajax({
//            async: true,
//            type: "GET",
//            url: window.location.href + 'sony/GetModels',
//            data: {},
//        });

//        if (result['success'] == false) {
//            throw new Error(res["error"] + ". Please fix the problem and click Run again.");
//        }

//        AddApiOutput(result.value);

//        var json = JSON.parse(result.value);

//        for (var model in json.models) {
//            for (var project in json.models[model].projects) {
//                list.append(new Option(json.models[model].projects[project].model_project_name, json.models[model].projects[project].model_project_name));
//            }
//        }
//    } catch (err) {
//        alert("GetModels() : Error (" + err.status + ") " + err.statusText);
//    }
//}

async function CreateCustomVisionProject() {

    var resultElement = document.getElementById('btnNewCustomVisionProjectCreateResult');

    try {
        var projectName = document.getElementById("newCustomVisionProjectName");
        console.log("CreateCustomVisionProject() Name " + projectName.value)

        var projectComment = document.getElementById("newCustomVisionProjectComment");

        if (projectComment.value.length > 0) {
            console.log("Comment " + projectComment.value)
        }

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/CreateBaseCustomVisionProject',
            data: {
                project_name: projectName.value,
                comment: projectComment.value.length == 0 ? null : projectComment.value
            },
        });

        AddApiOutput("CreateBaseCustomVisionProject", result.value);
        resultElement.innerHTML = result.value;

    } catch (err) {
        alert("customvision_base() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}

async function DeleteCustomVisionProject(project_name) {

    var resultElement = document.getElementById('btnDeleteCustomVisionProjectResult');

    try {
        var projectName = document.getElementById("newCustomVisionProjectName");
        console.log("CreateCustomVisionProject() Name " + projectName.value)

        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.href + 'sony/DeleteProject',
            data: {
                project_name: project_name
            },
        });

        AddApiOutput("CreateBaseCustomVisionProject", result.value);
        resultElement.innerHTML = result.value;

    } catch (err) {
        alert("customvision_base() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}

async function SaveCustomVisionModel() {

    var resultElement = document.getElementById('btnSaveModelResult');

    try {
        var project_name = document.getElementById("saveModelProjectList").selectedIndex == 0 ? null : document.getElementById("saveModelProjectList")[document.getElementById("saveModelProjectList").selectedIndex].text
        var model_id = document.getElementById("saveModelModelId").value;
        var initial_version_number = document.getElementById("saveModelInitialVersion").value;
        var functionality = document.getElementById("saveModelFunctionality").value;
        var vendor_name = document.getElementById("saveModelVendorName").value;
        var comment = document.getElementById("saveModelComment").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/SaveCustomVisionModel',
            data: {
                project_name: project_name,
                model_id: model_id,
                initial_version_number: initial_version_number,
                functionality: functionality,
                vendor_name: vendor_name,
                comment: comment
            },
        });

        AddApiOutput("SaveCustomVisionModel", result.value);
        resultElement.innerHTML = result.value;

    } catch (err) {
        alert("SaveCustomVisionModel() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}

async function ConvertModel() {

    var resultElement = document.getElementById('btnConvertModelResult');

    var model_id = document.getElementById("convertModelModelList").selectedIndex == 0 ? null : document.getElementById("convertModelModelList").value;
    var device_id = document.getElementById("convertModelDeviceList").selectedIndex == 0 ? null : document.getElementById("convertModelDeviceList").value;

    try {
        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/ConvertModel',
            data: {
                model_id: model_id,
                device_id: device_id
            }
        });

        AddApiOutput("ConvertModel", result.value);
        resultElement.innerHTML = result.value;
    } catch (err) {
        alert("ConvertModel() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
        resultElement.innerHTML = err.responseJSON ? err.responseJSON.value : error.responseText;
    }
}

async function StartUploadInferenceResult() {

    try {
        var device_id = document.getElementById("startInferenceDeviceId").value;
        var FrequencyOfInferences = document.getElementById("startInferenceFrequency").value;
        var MaxDetectionsPerFrame = document.getElementById("startUploadRetrainingDataMaxDetection").value;
        var CropHOffset = document.getElementById("startInferenceCropHOffset").value;
        var CropVOffset = document.getElementById("startInferenceCropVOffset").value;
        var CropHSize = document.getElementById("startInferenceCropHSize").value;
        var CropVSize = document.getElementById("startInferenceCropVSize").value;
        var NumberOfInferencesPerMessage = document.getElementById("startInferenceNumberOfInferencesPerMessage").value;
        var model_id = document.getElementById("startInferenceModelId").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/StartUploadInferenceResult',
            data: {
                device_id: device_id,
                FrequencyOfInferences: FrequencyOfInferences,
                MaxDetectionsPerFrame: MaxDetectionsPerFrame,
                CropHOffset: CropHOffset,
                CropVOffset: CropVOffset,
                CropHSize: CropHSize,
                CropVSize: CropVSize,
                NumberOfInferencesPerMessage: NumberOfInferencesPerMessage,
                model_id: model_id
            },
        });

        AddApiOutput("StartUploadInferenceResult", result.value);

    } catch (err) {
        alert("customvision_base() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

async function StopUploadInferenceResult() {

    try {
        var device_id = document.getElementById("startInferenceDeviceId").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/StopUploadInferenceResult',
            data: {
                device_id: device_id
            },
        });

        AddApiOutput("StopUploadInferenceResult", result.value);

    } catch (err) {
        alert("StopUploadInferenceResult() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

async function StartUploadRetrainingData() {

    try {
        var device_id = document.getElementById("startUploadRetrainingDataDeviceId").value;
        var Mode = document.getElementById("startUploadRetrainingDataMode").selectedIndex == 0 ? null : document.getElementById("startUploadRetrainingDataMode").value;
        var FileFormat = document.getElementById("startUploadRetrainingDataFileFormat").selectedIndex == 0?null: document.getElementById("startUploadRetrainingDataFileFormat").value;
        var CropHOffset = document.getElementById("startUploadRetrainingDataCropHOffset").value;
        var CropVOffset = document.getElementById("startUploadRetrainingDataCropVOffset").value;
        var CropHSize = document.getElementById("startUploadRetrainingDataCropHSize").value;
        var CropVSize = document.getElementById("startUploadRetrainingDataCropVSize").value;
        var NumberOfImages = document.getElementById("startUploadRetrainingDataNumImages").value;
        var FrequencyOfImages = document.getElementById("startUploadRetrainingDataFrequency").value;
        var MaxDetectionsPerFrame = document.getElementById("startUploadRetrainingDataMaxDetection").value;
        var NumberOfInferencesPerMessage = document.getElementById("startUploadRetrainingDataNumInference").value;
        var model_id = document.getElementById("startUploadRetrainingDataModelId").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/StartUploadRetrainingData',
            data: {
                device_id: device_id,
                Mode: Mode,
                FileFormat: FileFormat,
                CropHOffset: CropHOffset,
                CropVOffset: CropVOffset,
                CropHSize: CropHSize,
                CropVSize: CropVSize,
                NumberOfImages: NumberOfImages,
                FrequencyOfImages: FrequencyOfImages,
                MaxDetectionsPerFrame: MaxDetectionsPerFrame,
                NumberOfInferencesPerMessage: NumberOfInferencesPerMessage,
                model_id: model_id
            },
        });

        AddApiOutput("StartUploadRetrainingData", result.value);

    } catch (err) {
        alert("StartUploadRetrainingData() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

async function StopUploadRetrainingData() {

    try {
        var device_id = document.getElementById("startUploadRetrainingDataDeviceId").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/StopUploadRetrainingData',
            data: {
                device_id: device_id
            },
        });

        AddApiOutput("StopUploadRetrainingData", result.value);

    } catch (err) {
        alert("StopUploadRetrainingData() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

async function GetDevices(listElementId) {

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDevices',
            data: {}
        });

        AddApiOutput("GetDevices", result.value);

        if (listElementId) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElementId);
            list.innerText = null;
            var option = new Option("Select from list", null);
            option.disabled = true;
            list.append(option);
            for (var device in json.devices) {
              list.append(new Option(json.devices[device].device_id, json.devices[device].device_id))
            }
            list.options[0].selected = true;
        }
    } catch (err) {
        alert("GetDevices() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

async function GetAllModels(listElement) {

    try {
        resp = await GetModels(null, null, null, null, null, null, null, listElement);
    } catch (err) {
        alert("GetAllModels() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

async function GetModels(model_id, comment, project_name, model_platform, project_type, device_id, latest_type, listElement) {

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetModels',
            data: {
                model_id: model_id,
                comment: comment,
                project_name: project_name,
                model_platform: model_platform,
                project_type: project_type,
                device_id: device_id,
                latest_type: latest_type
            }
        });

        AddApiOutput("GetModels", result.value);

        if (listElement) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElement);
            list.innerText = null;
            var option = new Option("Select from list", null);
            option.disabled = true;
            list.append(option);
            for (var project in json.models[0].projects) {
                list.append(new Option(json.models[0].projects[project].model_project_name, json.models[0].projects[project].model_project_name));
            }
            list.options[0].selected = true;
        }
    } catch (err) {
        alert("GetModels() : " + err.statusText + "(" + err.status + ") : " + err.responseText);
    }
}

