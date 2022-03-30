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
        }
    }



    myMsal = new Msal.UserAgentApplication(authConfig);
    getTokens();
}

function PostToken(token) {
    console.log("PostToken() : " + token);

    $.ajax({
        type: "POST",
        url: window.location.href + 'home/PostToken',
        data: { token: token },
        success: function (response) {
            console.log(response)
        },
        error: function (req, status, error) {
            alert("Error " + status);
        }
    });
}