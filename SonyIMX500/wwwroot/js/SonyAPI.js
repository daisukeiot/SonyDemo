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

function setResultElement(resultElement, msg) {

    if (msg) {
        var json = JSON.parse(msg);

        if (json.result && json.result == "ERROR") {
            if (json.message) {
                resultElement.innerHTML = json.message;
            }
            else {
                resultElement.innerHTML = json.stringify();
            }
        }
        else {
            resultElement.innerHTML = msg;
        }
    }
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

function processError(funcName, err, bShowAlert) {

    var msg;

    if (err.responseJSON) {
        msg = err.responseJSON.value;
    }
    else {
        msg = err.statusText;
    }

    if (bShowAlert) {
        alert(funcName + " : " + err.statusText + "(" + err.status + ") : " + msg);
    }

    return msg;
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

async function getToken() {
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
    document.getElementById('tabApiOutput').value = null;
    document.getElementById('tabApiOutput').value = JSON.stringify(json, null, 2);
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

async function CreateBaseCustomVisionProject() {

    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('createBaseCustomVisionProjectBtnResult');

    try {
        var projectName = document.getElementById("createBaseCustomVisionProjectName");
        console.log("CreateBaseCustomVisionProject() Name " + projectName.value)

        var projectComment = document.getElementById("createBaseCustomVisionProjectComment");

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

        msg = result.value;

        var project_list = document.getElementById('selectCustomVisionProjectList');
        project_list.append(new Option(projectName.value, projectName.value, true, true));
        project_list.dispatchEvent(new Event('change'));

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
}

async function DeleteProject(project_name) {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('deleteCustomVisionProjectBtnResult');
    var ret = true;

    try {
        var projectName = document.getElementById("createBaseCustomVisionProjectName");
        console.log("CreateBaseCustomVisionProject() Name " + projectName.value)

        //Delete Models first
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetModels',
            data: {
                model_id: null,
                comment: null,
                project_name: project_name,
                model_platform: null,
                project_type: null,
                device_id: null,
                latest_type: null
            }
        });

        var json = JSON.parse(result.value);

        for (var model in json.models) {
            await DeleteModel(json.models[model].model_id)
                .catch(err => {
                    console.error(funcName + " Error : " + err);
                    return false;
                })
        }

        if (ret != false) {
            const result_proj = await $.ajax({
                async: true,
                type: "DELETE",
                url: window.location.href + 'sony/DeleteProject',
                data: {
                    project_name: project_name
                },
            });

            msg = result_proj.value;
        }

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
}

async function SaveCustomVisionModel() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('saveCustomVisionModelBtnResult');

    try {
        var project_name = document.getElementById("saveCustomVisionModelProjectNameList").selectedIndex == 0 ? null : document.getElementById("saveCustomVisionModelProjectNameList")[document.getElementById("saveCustomVisionModelProjectNameList").selectedIndex].text
        var model_id = document.getElementById("saveCustomVisionModelProjectModelId").value;
        var initial_version_number = document.getElementById("saveCustomVisionModelInitialVersionNumber").value;
        var functionality = document.getElementById("saveCustomVisionModelFunctionality").value;
        var vendor_name = document.getElementById("saveCustomVisionModelVendorName").value;
        var comment = document.getElementById("saveCustomVisionModelComment").value;

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

        msg = result.value;

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
}

async function ConvertModel() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var json = null;
    var resultElement = document.getElementById('convertModelBtnResult');

    var model_id = document.getElementById("convertModelModelIdList").selectedIndex == 0 ? null : document.getElementById("convertModelModelIdList").value;
    var device_id = document.getElementById("convertModelDeviceIdList").selectedIndex == 0 ? null : document.getElementById("convertModelDeviceIdList").value;

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

        json = JSON.parse(result.value);
        msg = result.value;

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }

    if (json) {
        return json.conv_id;
    }
    else {
        return null;
    }
}

async function PublishModel() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('publishModelBtnResult');
    var json = null;

    var model_id = document.getElementById("publishModelModelIdList").selectedIndex == 0 ? null : document.getElementById("publishModelModelIdList").value;
    var device_id = document.getElementById("publishModelDeviceIdList").selectedIndex == 0 ? null : document.getElementById("publishModelDeviceIdList").value;

    try {
        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/PublishModel',
            data: {
                model_id: model_id,
                device_id: device_id
            }
        });

        json = JSON.parse(result.value);
        msg = result.value;

    } catch (err) {
        msg = processError(funcName, err, true);
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }

    if (json) {
        return json.conv_id;
    }
    else {
        return null;
    }
}

async function GetBaseModelStatus(model_id, latest_type) {

    var funcName = arguments.callee.name + "()";
    var msg;
    var json = null;

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetBaseModelStatus',
            data: {
                model_id: model_id,
                latest_type: latest_type
            }
        });

        msg = result.value;

        json = JSON.parse(result.value);

    } catch (err) {
        if (err.responseJSON) {
            msg = err.responseJSON.value;
        }
        else {
            msg = err.statusText;
        }
        alert(funcName + " : " + err.statusText + "(" + err.status + ") : " + msg);
    } finally {
        if (msg) {
            AddApiOutput(funcName, msg);
        }
    }

    if (json) {
        return JSON.stringify(json.projects[0]);
    }
    else {
        return null;
    }
}

async function GetFirmwares(firmware_type, ppl, listElementId) {
    var funcName = arguments.callee.name + "()";
    var msg;
    var ret = true;

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetFirmwares',
            data: {
                firmware_type: firmware_type,
                ppl: ppl
            }
        });

        if (listElementId) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElementId);
            list.innerText = null;
            var option = new Option("Select from list", "");
            option.disabled = true;
            list.append(option);
            for (var firmware in json.firmwares) {
                for (var version in json.firmwares[firmware].versions) {
                    list.append(new Option(json.firmwares[firmware].versions[version].version_number, json.firmwares[firmware].versions[version].version_number));
                }
            }
            if (list.options.length == 2) {
                list.options[1].selected = true;
            }
            else {
                list.options[0].selected = true;
            }
        }
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    } finally {
        if (msg) {
            AddApiOutput(funcName, msg);
        }
    }

    return ret;
}

async function CreateDeployConfiguration() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('createDeployConfigurationResult');
    var ret = true;

    try {
        var config_id = document.getElementById("createDeployConfigurationConfigId").value;
        var sensor_loader_version_number = document.getElementById("createDeployConfigurationSensorLoaderVersionNumber").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationSensorLoaderVersionNumber").value;
        var sensor_version_number = document.getElementById("createDeployConfigurationSensorVersionNumber").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationSensorVersionNumber").value;
        var model_id = document.getElementById("createDeployConfigurationModelId").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationModelId").value;
        var ap_fw_version_number = document.getElementById("createDeployConfigurationApFwVersionNumber").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationApFwVersionNumber").value;
        var comment = document.getElementById("createDeployConfigurationComment").value;
        var device_type = document.getElementById("createDeployConfigurationDeviceTypeList").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationDeviceTypeList").value;
        var model_version_number = document.getElementById("createDeployConfigurationModelVersionNumber").value;
        var color_matrix_mode = document.getElementById("createDeployConfigurationColorMatrixModelList").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationColorMatrixModelList").value;
        var color_matrix_file_name = document.getElementById("createDeployConfigurationColorMatrixFileName").value;
        var gamma_mode = document.getElementById("createDeployConfigurationGammaModeList").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationGammaModeList").value;
        var gamma_file_name = document.getElementById("createDeployConfigurationGammaFileName").value;
        var lsc_mode = document.getElementById("createDeployConfigurationLscModeList").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationLscModeList").value;
        var lsc_file_name = document.getElementById("createDeployConfigurationLscFileName").value;
        var prewb_mode = document.getElementById("createDeployConfigurationPrewbModeList").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationPrewbModeList").value;
        var prewb_file_name = document.getElementById("createDeployConfigurationDewarpFileName").value;
        var dewarp_mode = document.getElementById("createDeployConfigurationDewarpModeList").selectedIndex == 0 ? null : document.getElementById("createDeployConfigurationDewarpModeList").value;
        var prewb_file_name = document.getElementById("createDeployConfigurationDewarpFileName").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/CreateDeployConfiguration',
            data: {
                config_id: config_id,
                sensor_loader_version_number: sensor_loader_version_number,
                sensor_version_number: sensor_version_number,
                model_id: model_id,
                ap_fw_version_number: ap_fw_version_number,
                comment: comment,
                device_type: device_type,
                model_version_number: model_version_number,
                color_matrix_mode: color_matrix_mode,
                color_matrix_file_name: color_matrix_file_name,
                gamma_mode: gamma_mode,
                gamma_file_name: gamma_file_name,
                lsc_mode: lsc_mode,
                lsc_file_name: lsc_file_name,
                prewb_mode: prewb_mode,
                prewb_file_name: prewb_file_name,
                dewarp_mode: dewarp_mode,
                prewb_file_name: prewb_file_name
            },
        });

        msg = result.value;
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }

    return ret;
}

function CheckCreateDeployConfigurationInputs() {
    var enable = true;
    var configId = document.getElementById('createDeployConfigurationConfigId').value;
    var sensorLoaderVer = document.getElementById('createDeployConfigurationSensorLoaderVersionNumber');
    var sensorVer = document.getElementById('createDeployConfigurationSensorVersionNumber');
    var modelId = document.getElementById('createDeployConfigurationModelId');
    var apFwVer = document.getElementById('createDeployConfigurationApFwVersionNumber');

    if (configId.length == 0) {
        enable = false;
    }
    else if (sensorLoaderVer.selectedIndex == 0) {
        enable = false;
    }
    else if (sensorVer.selectedIndex == 0) {
        enable = false;
    }
    else if (modelId.selectedIndex == 0) {
        enable = false;
    }
    else if (apFwVer.selectedIndex == 0) {
        enable = false;
    }

    if (enable) {
        $('#createDeployConfigurationBtn').prop('disabled', false);
    }
    else {
        $('#createDeployConfigurationBtn').prop('disabled', true);
    }
}

async function GetDeployConfigurations(listElementId) {
    var funcName = arguments.callee.name + "()";
    var msg;
    var ret = true;

    try {

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDeployConfigurations',
            data: {
            },
        });

        msg = result.value;

        if (listElementId) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElementId);
            list.innerText = null;
            var option = new Option("Select from list", "");
            option.disabled = true;
            list.append(option);
            for (var deploy_configuration in json.deploy_configurations) {
                list.append(new Option(json.deploy_configurations[deploy_configuration].config_id, json.deploy_configurations[deploy_configuration].config_id));
            }
            if (list.options.length == 2) {
                list.options[1].selected = true;
            }
            else {
                list.options[0].selected = true;
            }
        }
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    } finally {
        if (msg) {
            AddApiOutput(funcName, msg);
        }
    }

    return ret;
}

function CheckDeployByConfigurationInputs() {
    var enable = true;
    var configId = document.getElementById('deployByConfiguraionFormConfigIdList');
    var deviceId = document.getElementById('deployByConfiguraionDeviceIdList');

    if (configId.selectedIndex == 0) {
        enable = false;
    }
    else if (deviceId.selectedIndex == 0) {
        enable = false;
    }

    if (enable) {
        $('#deployByConfiguratonBtn').prop('disabled', false);
    }
    else {
        $('#deployByConfiguratonBtn').prop('disabled', true);
    }
}

async function DeployByConfiguration() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('deployByConfiguratonBtnResult');
    var ret = true;

    try {
        var config_id = document.getElementById("deployByConfiguraionFormConfigIdList").selectedIndex == 0 ? null : document.getElementById("deployByConfiguraionFormConfigIdList").value;
        var device_ids = document.getElementById("deployByConfiguraionDeviceIdList").selectedIndex == 0 ? null : document.getElementById("deployByConfiguraionDeviceIdList").value;
        var comment = document.getElementById("deployByConfiguraionComment").value;
        var replace_model_id = document.getElementById("deployByConfiguraionReplaceModelIdList").selectedIndex == 0 ? null : document.getElementById("deployByConfiguraionReplaceModelIdList").value;

        const result = await $.ajax({
            async: true,
            type: "PUT",
            url: window.location.href + 'sony/DeployByConfiguration',
            data: {
                config_id: config_id,
                device_ids: device_ids,
                comment: comment,
                replace_model_id: replace_model_id
            },
        });

        msg = result.value;
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }

    return ret;
}

async function GetDeployHistory() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultMsg;
    var resultElement = document.getElementById('getDeployHistoryBtnResult');

    try {
        var device_id = document.getElementById("deployByConfiguraionDeviceIdList").selectedIndex == 0 ? null : document.getElementById("deployByConfiguraionDeviceIdList").value;

        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDeployHistory',
            data: {
                device_id: device_id
            },
        });

        msg = result.value;
        resultMsg = '{"result" : "Success"}';
    } catch (err) {
        msg = processError(funcName, err, true);
        resultMsg = msg;
    } finally {
        if (msg) {
            AddApiOutput(funcName, msg);
        }

        if (resultMsg) {
            setResultElement(resultElement, resultMsg);
        }
    }

    return msg;
}

async function StartUploadInferenceResult() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('btnStartUploadInferenceResultResult');
    var ret = true;

    try {
        var device_id = document.getElementById("startUploadInferenceResultDeviceIdList").value;
        var FrequencyOfInferences = document.getElementById("startUploadInferenceResultFrequencyOfInferences").value;
        var MaxDetectionsPerFrame = document.getElementById("startUploadRetrainingDataMaxDetectionPerFrame").value;
        var CropHOffset = document.getElementById("startUploadInferenceResultCropHOffset").value;
        var CropVOffset = document.getElementById("startUploadInferenceResultCropVOffset").value;
        var CropHSize = document.getElementById("startUploadInferenceResultCropHSize").value;
        var CropVSize = document.getElementById("startUploadInferenceResultCropVSize").value;
        var NumberOfInferencesPerMessage = document.getElementById("startUploadInferenceResultNumberOfInferencesPerMessage").value;
        var model_id = document.getElementById("startUploadInferenceResultModelIdList").value;

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

        msg = result.value;
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;

    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
    return ret;
}

async function StopUploadInferenceResult() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('stopUploadInferenceResultBtnResult');
    var ret = true;

    try {
        var device_id = document.getElementById("stopUploadInferenceResultDeviceIdList").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/StopUploadInferenceResult',
            data: {
                device_id: device_id
            },
        });

        msg = result.value;
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
    return ret;
}

async function StartUploadRetrainingData() {
    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('startUploadRetrainingDataBtnResult');
    var ret = true;

    try {
        var device_id = document.getElementById("startUploadRetrainingDataDeviceIdList").value;
        var Mode = document.getElementById("startUploadRetrainingDataModeList").selectedIndex == 0 ? null : document.getElementById("startUploadRetrainingDataModeList").value;
        var FileFormat = document.getElementById("startUploadRetrainingDataFileFormatList").selectedIndex == 0?null: document.getElementById("startUploadRetrainingDataFileFormatList").value;
        var CropHOffset = document.getElementById("startUploadRetrainingDataCropHOffset").value;
        var CropVOffset = document.getElementById("startUploadRetrainingDataCropVOffset").value;
        var CropHSize = document.getElementById("startUploadRetrainingDataCropHSize").value;
        var CropVSize = document.getElementById("startUploadRetrainingDataCropVSize").value;
        var NumberOfImages = document.getElementById("startUploadRetrainingDataNumImages").value;
        var FrequencyOfImages = document.getElementById("startUploadRetrainingDataFrequencyOfImages").value;
        var MaxDetectionsPerFrame = document.getElementById("startUploadRetrainingDataMaxDetectionPerFrame").value;
        var NumberOfInferencesPerMessage = document.getElementById("startUploadRetrainingDataNumInferencePerMessage").value;
        var model_id = document.getElementById("startUploadRetrainingDataModelIdList").value;

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

        msg = result.value;
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;

    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
    return ret;
}

async function StopUploadRetrainingData() {

    var funcName = arguments.callee.name + "()";
    var msg;
    var resultElement = document.getElementById('stopUploadRetrainingDataBtnResult');
    var ret = true;

    try {
        var device_id = document.getElementById("startUploadRetrainingDataDeviceIdList").value;

        const result = await $.ajax({
            async: true,
            type: "POST",
            url: window.location.href + 'sony/StopUploadRetrainingData',
            data: {
                device_id: device_id
            },
        });
        msg = result.value;
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    } finally {
        if (msg) {
            setResultElement(resultElement, msg);
            AddApiOutput(funcName, msg);
        }
    }
    return ret;
}

async function GetDevices(listElementId, silent) {

    var funcName = arguments.callee.name + "()";
    var ret = true;

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDevices',
            data: {}
        });

        if (!silent) {
            AddApiOutput("GetDevices", result.value);
        }

        if (listElementId) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElementId);

            list.innerText = null;
            var option = new Option('Select from list', '');
            option.disabled = true;
            list.append(option);
            for (var device in json.devices) {
              list.append(new Option(json.devices[device].device_id, json.devices[device].device_id))
            }
            list.options[0].selected = true;
        }
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    }
    return ret;
}

async function GetDevicesPayload() {

    var funcName = arguments.callee.name + "()";

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDevices',
            data: {}
        });

        AddApiOutput(funcName, result.value);

        $("#deviceListTbl").find("tr:gt(0)").remove();
        //$("#deviceListDetails").hide();
        var json = JSON.parse(result.value);
        for (var device in json.devices) {
            addDevice(json.devices[device].device_id, json.devices[device].status, json.devices[device].connectionState, json.devices[device]);
        }
    } catch (err) {
        processError(funcName, err, true);
    }
    return;
}

async function GetDevicesForImageGallery(listElementId, silent) {

    var funcName = arguments.callee.name + "()";
    var ret = true;

    try {
        const result = await $.ajax({
            async: true,
            type: "GET",
            url: window.location.href + 'sony/GetDevices',
            data: {}
        });

        if (!silent) {
            AddApiOutput("GetDevices", result.value);
        }

        if (listElementId) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElementId);

            list.innerText = null;
            var option = new Option('All', 'All');
            option.setAttribute('data-filter', 'all');
            list.append(option);
            for (var device in json.devices) {
                var option = new Option(json.devices[device].device_id, json.devices[device].device_id);
                option.setAttribute('data-filter', json.devices[device].device_id);
                list.append(option);
            }
            list.options[0].selected = true;
        }
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    }
    return ret;
}

async function GetAllModels(listElement) {
    return await GetModels(null, null, null, null, null, null, null, listElement);
}

async function GetModels(model_id, comment, project_name, model_platform, project_type, device_id, latest_type, listElement) {

    var funcName = arguments.callee.name + "()";
    var ret = true;

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

        if (listElement) {
            var json = JSON.parse(result.value);

            var list = document.getElementById(listElement);
            list.innerText = null;
            var option = new Option("Select from list", "");
            option.disabled = true;
            list.append(option);
            for (var model in json.models) {
                list.append(new Option(json.models[model].model_id, json.models[model].model_id));
            }
            list.options[0].selected = true;
        }
    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    }

    return ret;
}

async function DeleteModel(model_id) {

    var funcName = arguments.callee.name + "()";
    var ret = true;

    try {
        const result = await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.href + 'sony/DeleteModel',
            data: {
                model_id: model_id
            }
        });

    } catch (err) {
        msg = processError(funcName, err, true);
        ret = false;
    }

    return ret;
}

function addDevice(deviceId, status, connectionStatus, payload) {
    var context = {
        deviceId: deviceId,
        deviceStatus: status,
        deviceConnectionStatus: connectionStatus,
        dataPayload: JSON.stringify(payload, undefined, 2)
    };
    var source = document.getElementById('deviceList-template').innerHTML;
    var template = Handlebars.compile(source);
    var html = template(context);
    $("#deviceListTbl").show();
    $('#deviceListDetails').prepend(html);
}