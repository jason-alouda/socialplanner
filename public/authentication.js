import "https://apis.google.com/js/client.js";

/* Provides a few methods for having a user sign in with their Google account */
export default class GoogleSignin {
  /* Initialize the Google auth API. clientId must be a valid OAuth2 client ID, and the current origin
     (e.g. http://localhost:1930) must be listed as an authorized JavaScript origin.
     Returns a new GoogleSignin instance if successful. On error, logs the error to the console and returns null. */
  static async init(clientId) {
    try {
      await new Promise(resolve => gapi.load("signin2", () => resolve()));
      await gapi.client.init({ client_id: clientId, scope: "profile" });
      return new this();
    } catch (e) {
      console.error("Error loading Google auth:", e);
      return null;
    }
  }

  constructor() {
    this._auth = gapi.auth2.getAuthInstance();
    if (!this._auth) throw new Error("Google auth not initialized. Did you call GoogleSignin.init?");
  }

  isSignedIn() {
    return this._auth.isSignedIn.get();
  }

  /* Replace the DOM element id with a Google signin button. opts are the options passed to render, see
     https://developers.google.com/identity/sign-in/web/build-button. You probably want to at least pass
     onsuccess, a callback called when the user is signed in */
  renderSignIn(id, opts) {
    return gapi.signin2.render(id, opts);
  }

  /* Sign out the user */
  async signOut() {
    return this._auth.signOut();
  }

  /* Return info about the current sign in: the user's ID token, when they signed in, and when the ID token will
     expire. Returns null if the user isn't signed in */
  getAuthInfo() {
    if (!this.isSignedIn()) return null;
    let auth = this._auth.currentUser.get().getAuthResponse();
    return {
      idToken: auth.id_token,
      signedInAt: new Date(auth.first_issued_at),
      expiresAt: new Date(auth.expires_at),
    };
  }

  /* Returns a basic user profile, or null if they aren't signed in */
  getProfile() {
    if (!this.isSignedIn()) return null;
    let p = this._auth.currentUser.get().getBasicProfile();
    return {
      id: p.getId(), name: p.getName(), givenName: p.getGivenName(), familyName: p.getFamilyName(),
      email: p.getEmail()
    };
  }
}
