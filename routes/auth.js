var express = require('express');
var router = express.Router();
const { Issuer, generators } = require('openid-client');



// Load environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const issuerUrl = process.env.APPID_ISSUER;


// OIDC client setup
let client;
async function setupClient() {
    const googleIssuer = await Issuer.discover(issuerUrl);
    client = new googleIssuer.Client({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uris: [redirectUri],
        response_types: ['code'],
    });
}
setupClient().catch(console.error);

// Generate and store a new state value for each authorization request
const state = generators.state();

router.get('/login', (req, res) => {
    // Redirect to Google's OAuth 2.0 server
    const authorizationUrl = client.authorizationUrl({
        access_type: 'offline',
        scope: 'openid email profile',
        response_mode: 'query',
        state: state,
    });
    res.redirect(authorizationUrl);
});


/* GET Callback */
router.get('/callback', async (req, res) => {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(redirectUri, params, { state });
    const userInfo = await client.userinfo(tokenSet);
    console.log({ tokenSet, userInfo });

    // Set token in a secure, httpOnly cookie
    res.cookie('token_set', tokenSet, { httpOnly: true, secure: true });
    res.cookie('user_info', userInfo, { httpOnly: true, secure: true });

    res.redirect('/');
});


/* GET Logout */
router.get('/logout', async (req, res) => {
    const { token_set: tokenSet } = req.cookies;

    res.clearCookie('token_set');
    res.clearCookie('user_info');


    await client.revoke(tokenSet.access_token);

    res.redirect('/');
});

/* GET Refresh */
router.get('/refresh', async (req, res) => {
    const { token_set: tokenSet } = req.cookies;
    if (tokenSet && tokenSet.refresh_token) {
        const refreshedTokenSet = await client.refresh(tokenSet.refresh_token);
        res.cookie('token_set', refreshedTokenSet, { httpOnly: true, secure: true })
        res.redirect('/');
    } else {
        res.redirect('/auth/logout');
    }
});

module.exports = router;
