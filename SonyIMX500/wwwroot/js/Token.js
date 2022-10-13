let myMsal = null;
let accessTokenRequest;
let interval = null;

const loginScope = {
    scopes: ["User.Read"],
};

let authConfig = null;

// MSAL token functions

function sonyApiInitializeMsal() {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    var url = window.location.href;
    var clientId = document.getElementById('clientId').value;

    if ((myMsal != null) && (authConfig && authConfig.auth.clientId == clientId)) {
        return;
    }

    if (clientId.length == 0) {
        console.log("Client ID empty");
        return;
    }

    authConfig = {
        auth: {
            clientId: clientId,
            redirectUri: url
        }
    }
    console.debug("Redirect Url : " + authConfig.auth.redirectUri);
    console.debug("Client ID    : " + authConfig.auth.clientId);

    myMsal = new Msal.UserAgentApplication(authConfig);

    accessTokenRequest = {
        scopes: [authConfig.auth.clientId],
        prompt: 'none',
        authority: null,
        account: myMsal.getAccount()
    }

    myMsal.handleRedirectCallback((err, response) => {
        //debugger;
        if (err) {
            alert(err);
        } else {
            updateLoginTab(response);
        }
    });

    SetClientId(authConfig.auth.clientId);
}

async function sonyApiGetToken() {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    if (!myMsal.getAccount()) {
        // Not logged in.  Start login.
        console.debug("Redirect to login");
        myMsal.loginRedirect(loginScope);
    }
    else {

        try {
            console.debug("Getting Token");
            tokenResp = await myMsal.acquireTokenSilent(accessTokenRequest);
            console.log('### MSAL acquireTokenSilent was successful')
            updateLoginTab(tokenResp);
            return tokenResp.idToken.rawIdToken;

        } catch (err) {
            console.log('### MSAL acquireTokenSilent was unsuccessful : ' + err);
            switch (err.errorCode) {
                case "consent_required":
                case "interaction_required":
                case "login_required":
                    tokenResp = await myMsal.acquireTokenPopup(accessTokenRequest)
                    console.log('### MSAL acquireTokenPopup was successful')
                    break;

                case "user_login_error":
                    console.log('### MSAL Login Error');
                    if (!myMsal.getLoginInProgress()) {
                        myMsal.loginRedirect(loginRequest);
                    }
                    break;
                default:
                    break;
            }

            return null;
        }
    }
}

async function getToken() {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    var token = sonyApiGetToken();

    if (token) {
        document.getElementById('spanTokenLastUpdate').innerHTML = new Date();
        PostToken(token);
        if (interval == null) {
            interval = setInterval(function () { getToken(); }, 30 * 60 * 1000);
        }
    }
}

function updateLoginTab(tokenResp) {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    if (tokenResp == null) {
        document.getElementById('taToken').value = "Access Token not found in response.";
        document.getElementById('btnLoginResult').innerHTML = "Access Token not found in response";
    }
    else {
        document.getElementById('taToken').value = tokenResp.idToken.rawIdToken;
        document.getElementById('taToken').dispatchEvent(new Event("change"));

        if (String(expiresOn) !== String(tokenResp.expiresOn)) {
            expiresOn = tokenResp.expiresOn;
            document.getElementById('spanTokenExpire').innerHTML = String(tokenResp.expiresOn);
        }

        document.getElementById('userName').innerHTML = tokenResp.account.name;
        document.getElementById('userDesc').innerHTML = tokenResp.account.userName;
        document.getElementById('btnLoginResult').innerHTML = "Login Success";
        document.getElementById('clientId').value = tokenResp.idToken.claims.aud;
    }
}


function sonyApiLogout() {
    if (myMsal != null) {
        myMsal.logout();
    }
}