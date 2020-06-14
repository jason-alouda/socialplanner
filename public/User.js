import apiRequest from "./api.js";


/* A small class to represent a Goal */
export class Post {
  constructor(data) {
    this.user = data.user;
    this.time = new Date(data.time);
    this.text = data.text;
    this.x = data.x;
    this.y = data.y;
  }
}

export default class User {
  /* Returns an array of user IDs */
  static async listUsers() {
    let [status, data] = await apiRequest("GET", "users");
    if (status !== 200) throw new Error("Couldn't get list of users");
    return data.users;
  }

  /* Returns a User object, creating hte user if necessary */
  static async loadOrCreate(id) {
    let [status, data] = await apiRequest("GET", `users/${id}`);
    if (status === 200) {
      return new User(data);
    } else {
      let body = {};
      body.id = id;
      let [status, data] = await apiRequest("POST", "users", body);
      return new User(data);
    }
  }

  constructor(data) {
    Object.assign(this, data);
  }

  // Patch users - updates information on server - every time user info is changed
  async save() {
    let body = {};
    body.name = this.name;
    body.avatarURL = this.avatarURL;
    console.log(body);
    let [status, updatedUser] = await apiRequest("PATCH", `users/${this.id}`, body);
    console.log(updatedUser);
    //return updatedUser;
  }

  /* Returns an array of Post objects */
  async getFeed() {
    //let [status, posts] = await apiRequest("GET", `users/${id}/feed`);
    let [status, posts] = await apiRequest("GET", `users/${this.id}/feed`);
    return posts;
  }

  async makePost(goal, x, y) {
    let data = {};
    data.text = goal;
    data.x = x;
    data.y = y;
    let [status, dataRet] = await apiRequest("POST", `users/${this.id}/posts`, data);
    if (status !== 200) {
      alert("Failed to make new post");
    }
  }

  static async deletePost(id, post) {
    //console.log(this);
    let [status, data] = await apiRequest("DELETE", `users/${id}/posts/delete?target=${post}`);
    if (status === 400) {
      alert(data.error);
    }
  }


  //this.user.addFollow()
  static async addFollow(id1, id2) {
    //let [status, data] = await apiRequest("POST", `users/${this.id}/follow?target=${this.id}`);
    let [status, data] = await apiRequest("POST", `users/${id1}/follow?target=${id2}`);
    if (status === 400) {
      alert(data.error);
    }
  }

  // Same as addFollow
  static async deleteFollow(id1, id2) {
    let [status, data] = await apiRequest("DELETE", `users/${id1}/follow?target=${id2}`);
    if (status === 400) {
      alert(data.error);
    }
  }
}
