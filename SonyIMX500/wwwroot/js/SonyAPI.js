const defaultClientId = '6b8bbe61-f6e0-4490-ba1e-c65665741629';

let myMsal;

function sonyApiInitialize() {

    console.debug("sonyApiInitialize()");

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

function sonyApiAuth() {

    loginRequest = {
        scopes: ["User.Read"]
    }

    if (!myMsal.getAccount()) {
        myMsal.loginRedirect(loginRequest);
    }
}

function getLoginToken() {

    console.debug('getLoginToken');
    let raw_token = '';

    myMsal.acquireTokenSilent(renewTokenRequest)
        .then(function (response) {
            console.log("acquireTokenSilent succeed.");
            console.debug(response.idToken);

            if (response != undefined) {
                document.getElementById('taToken').value = response.idToken.rawIdToken;
                console.log('id Record time:' + String(expiresOn));
                console.log('id Expire time:' + String(response.expiresOn));

                if (String(expiresOn) !== String(response.expiresOn)) {
                    expiresOn = response.expiresOn;
                    document.getElementById('spanTokenExpire').innerHTML = String(response.expiresOn);
                }
            }

            return response.idToken.rawIdToken;
        })
        .catch((error) => {
            document.getElementById('taToken').value = error.errorMessage;
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
