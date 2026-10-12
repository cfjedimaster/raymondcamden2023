---
layout: post
title: "Adding Google Auth to TinyJS"
date: "2026-10-12T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/arrows.jpg
permalink: /2026/10/12/adding-google-auth-to-tinyjs
description: Adding a login with Google feature for TinyJS
---

A few days ago I [posted](https://www.raymondcamden.com/2026/10/08/tiny-apps-with-tinyjs) about my experience playing around with [TinyJS](https://tinyjs.app/). This is a *very* light "web to desktop app" platform for - well - building desktop apps. Its simplicity and similarity to PhoneGap (at least for the desktop) has got me interested in seeing what I can build with the project. One of my ideas would be improved with a login system so I naturally looked into adding a "Login with Google" feature. While this was *mostly* straightforward, I ran into some oddities and figured I'd share it here. 

I went into this exploration with a basic idea of how I'd approach it:

* Create an app in the Google Cloud console to represent my app, getting the client id and secret.
* Generate a link using the standard OAuth flow
* For my redirect URL, use a custom URI scheme (like `mycustomapp://`) so that on redirect from Google, it would open the app automatically
* The response would include the code I'd exchange for an access token (and refresh token), at which point I could get the user's profile and have their name and email address. I'm only thinking of that as my mental model for this little POC is *just* login, not using other Google services. 

Right away I hit a couple of snags.

* Google's OAuth flow specifically blocks the use of a custom URI scheme. Instead, you need to hit a locally running web server which would handle getting and verifying the code. I've actually seen this before, you end up with a new tab in your browser that says you can close the tab, but I had never implemented it before.
* The next bit isn't a snag per se, but in my research, I found that in most places, your desktop app can include just the client id, but for Google, you must include the secret as well. Obviously that makes me nervous as heck, but again, this is apparently a well known thing for desktop apps that authenticate with Google. While I don't feel 100% certain about this, I asked multiple agents, Googled, and so forth, and they all seemed to be in agreement. Absolutely correct me in a comment below if I'm wrong.

Alright, so with all of that in mind - I want to once again thank the author of the program for pointing me to the [platter demo](https://github.com/tarwin/tinyjsapp-examples/tree/main/platter) which implements the local web server mentioned above. I was able to point my coding agent to that when working through the demo. 

I have *not* put my code into a GitHub repo, but will include everything below. As this was just a POC I didn't feel like it was necessary, but if you want a zip, just ask. Nicely. Or not. I'll still send it.

## The Code

Ok, let me start with the simplest part, the HTML. I'm not using Alpine for this, or any real CSS. It's just this:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>__NAME__</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<main>
  <h1>Google sign-in Test</h1>
  <a id="login-link" href="#">Login with Google</a>
  <section id="profile" aria-live="polite" hidden>
    <h2>Signed in</h2>
    <p><strong>Name:</strong> <span id="profile-name"></span></p>
    <p><strong>Email:</strong> <span id="profile-email"></span></p>
  </section>
  <p id="login-error" role="alert" hidden></p>
</main>

<script src="app.js"></script>
</body>
</html>
```

I've got a login link (blank, that gets filled in later), a section that's displayed when you are logged in, and a block for errors. The login link should be hidden as well (I'll explain why later), but again I was trying to keep this simple.

Now let's look at the JavaScript, and this is a bit of a mess. With a proper framework like Alpine it would be better organized, but it gets the job done.

```js
const CLIENT_ID = "safe but why not be sure";

const REDIRECT_URI = "http://127.0.0.1:8765/callback";
const TOKENS_KEY = "google-oauth-tokens";

async function makeLoginUrl() {
  const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  );
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));

  // keep these for the token exchange step
  sessionStorage.setItem("pkce_verifier", verifier);
  sessionStorage.setItem("oauth_state", state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginLink = document.querySelector("#login-link");

  try {
    const savedTokens = await tiny.app.secrets.get(TOKENS_KEY);
    if (savedTokens) {
      try {
        const session = await tiny.api.call("restoreSession", {
          tokens: JSON.parse(savedTokens),
          clientId: CLIENT_ID,
        });
        await tiny.app.secrets.set(TOKENS_KEY, JSON.stringify(session.tokens));
        showProfile(session.profile);
        return;
      } catch {
        await tiny.app.secrets.delete(TOKENS_KEY);
      }
    }
    await prepareLogin(loginLink);
  } catch (error) {
    showError(`Google sign-in failed: ${error.message}`);
  }
});

async function prepareLogin(loginLink) {
  const url = await makeLoginUrl();
  const state = sessionStorage.getItem("oauth_state");
  const codeVerifier = sessionStorage.getItem("pkce_verifier");
  loginLink.href = url;
  loginLink.target = "_blank";
  loginLink.rel = "noopener";

  loginLink.onclick = async () => {
    try {
      const session = await tiny.api.call("waitForCode", {
        port: 8765,
        state,
        codeVerifier,
        clientId: CLIENT_ID,
      });
      await tiny.app.secrets.set(TOKENS_KEY, JSON.stringify(session.tokens));
      showProfile(session.profile);
    } catch (error) {
      showError(`Google sign-in failed: ${error.message}`);
      await prepareLogin(loginLink);
    }
  };
}

function showProfile(profile) {
  document.querySelector("#profile-name").textContent = profile.name || "Not provided";
  document.querySelector("#profile-email").textContent = profile.email || "Not provided";
  document.querySelector("#profile").hidden = false;
  document.querySelector("#login-link").hidden = true;
  document.querySelector("#login-error").hidden = true;
}

function showError(message) {
  const errorOutput = document.querySelector("#login-error");
  errorOutput.textContent = message;
  errorOutput.hidden = false;
}
```

I start off with a utility function to generate my login link. Note that redirect URI - it's going to be hosted by my app via the backend script and makes an assumption on a port that's free. A better version would try a set of ports to see which can be used. 

In my `DOMContentLoaded` block I've got multiple things going on.

First off - I look at a secure storage system for an existing access token. This is documented in the [secrets and auth](https://tinyjs.app/docs.html#secrets) section of TinyJS's docs. If the values exist, a call to the backend is made to try to verify the values and treat the user as already logged in. 

If this fails, or the values weren't there, we:

* Get the login URL and update the DOM
* Tell the backend to fire up the HTTP server
* And then wait for a success.

The final two functions just display the profile or an error. Now let's look at the backend:

```js
// Yes, I said it was safe, still, why share it here?
const GOOGLE_CLIENT_SECRET = "my secret brings the boys to the yard";

async function exchangeCodeForToken({ code, codeVerifier, clientId, port }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `http://127.0.0.1:${port}/callback`,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  const tokens = await response.json();
  if (!response.ok || tokens.error) {
    throw new Error(tokens.error_description || tokens.error || `Token request failed (${response.status}).`);
  }
  return tokens;
}

async function refreshAccessToken(refreshToken, clientId) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokens = await response.json();
  if (!response.ok || tokens.error) {
    throw new Error(tokens.error_description || tokens.error || `Token refresh failed (${response.status}).`);
  }
  return tokens;
}

function expiresAt(tokens) {
  const expiresIn = Number(tokens.expires_in);
  if (!tokens.access_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Google returned an invalid access token response.");
  }
  return Date.now() + expiresIn * 1000;
}

async function getUserProfile(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
  const profile = await response.json();
  if (!response.ok) {
    throw new Error(profile.error_description || profile.error || `Profile request failed (${response.status}).`);
  }
  return {
    name: profile.name || "",
    email: profile.email || "",
  };
}

async function restoreSession(tokens, clientId) {
  if (!tokens?.access_token || !tokens?.refresh_token || !tokens?.expires_at) {
    throw new Error("Saved sign-in is incomplete.");
  }

  let refreshedTokens = {};
  if (tokens.expires_at <= Date.now() + 60000) {
    refreshedTokens = await refreshAccessToken(tokens.refresh_token, clientId);
  }

  const updatedTokens = {
    access_token: refreshedTokens.access_token || tokens.access_token,
    refresh_token: refreshedTokens.refresh_token || tokens.refresh_token,
    expires_at: refreshedTokens.access_token
      ? expiresAt(refreshedTokens)
      : tokens.expires_at,
  };
  const profile = await getUserProfile(updatedTokens.access_token);
  return { profile, tokens: updatedTokens };
}

async function waitForCode(port, expectedState, codeVerifier, clientId) {
  return new Promise((resolve, reject) => {
    let server;
    let timer;
    let settled = false;
    let processing = false;

    const stopServer = () => {
      if (timer) clearTimeout(timer);
      if (!server) return;
      const activeServer = server;
      server = null;
      try {
        activeServer.close();
      } catch (error) {
        console.error("Failed to close OAuth callback server:", error);
      }
    };

    const finish = (error, code, closeImmediately = false) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (closeImmediately) stopServer();
      else setTimeout(stopServer, 1000);
      if (error) reject(error);
      else resolve(code);
    };

    const escapeHtml = (value) => String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const htmlResponse = (message, status = 200) => new Response(
      `<html><body><h3>${escapeHtml(message)}</h3></body></html>`,
      {
        status,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
        },
      }
    );

    server = tjs.serve({
      port,
      fetch: async (request) => {
        let url;
        try {
          url = new URL(request.url);
        } catch {
          return htmlResponse("Invalid callback request.", 400);
        }

        if (url.pathname !== "/callback") return htmlResponse("Not found.", 404);
        if (settled) return htmlResponse("This login request has already been processed.", 410);
        if (processing) return htmlResponse("This login request is being processed.", 409);
        if (url.searchParams.get("state") !== expectedState) {
          return htmlResponse("State mismatch. Return to the app and try again.", 400);
        }

        const oauthError = url.searchParams.get("error");
        if (oauthError) {
          finish(new Error(oauthError));
          return htmlResponse("Login failed: " + oauthError);
        }

        const code = url.searchParams.get("code");
        if (!code) {
          finish(new Error("OAuth callback did not include an authorization code."));
          return htmlResponse("Login failed: authorization code was missing.", 400);
        }

        processing = true;
        try {
          const tokens = await exchangeCodeForToken({
            code,
            codeVerifier,
            clientId,
            port,
          });
          const profile = await getUserProfile(tokens.access_token);
          finish(null, {
            profile,
            tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt(tokens),
            },
          });
          return htmlResponse("Login complete. You can close this tab.");
        } catch (error) {
          finish(error);
          return htmlResponse("Token exchange failed: " + error.message, 502);
        }
      },
    });

    timer = setTimeout(() => {
      finish(new Error("Timed out waiting for the OAuth callback."), null, true);
    }, 120000);
  });
}

export const api = {
  restoreSession: ({ tokens, clientId }) => {
    if (!clientId) throw new Error("Google client ID is required.");
    return restoreSession(tokens, clientId);
  },
  waitForCode: ({ port, state, codeVerifier, clientId }) => {
    if (!codeVerifier || !clientId) {
      throw new Error("OAuth code verifier and client ID are required.");
    }
    return waitForCode(port, state, codeVerifier, clientId);
  },
};
```

This one's a bit of a beast, but some are fairly standard. Both `exchangeCodeForToken` and `refreshAccessToken` are standard OAuth stuff. Ditto for `getUserProfile`. The important bit is `waitForCode`. This is where the small web server is kicked off that attempts to handle the redirect back from Google. I said up front I used AI to build most of this and I have to be honest, I'm glad I did as this part would have taken me quite some time. 

All in all - it works great. The only real issue is a nit-picky one - when the app loads you see the login link for a second before the stored auth is verified. A bit of UX magic there would handle that. 

There's an important part left out of this that I'll need to tackle next - which is how I would take the verified identity here and pass it to a remote service in a secure way such that the remote service can also verify it ("Yes, this was Raymond Camden") before performing an action.
