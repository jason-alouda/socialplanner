import EditableText from "./EditableText.js";
import DynamicList from "./DynamicList.js";
import User, {Post} from "./User.js";

import GoogleSignin from "./authentication.js";
const CLIENT_ID = "399108769281-oq55gpdh7bdb48n8tfdk4eht1ceh9ob8.apps.googleusercontent.com";

class App {

  constructor() {
    this._user = null;
    this._loginForm = null;
    this._addGoalContainer = null;

    this._newX = 0;
    this._newY = 0;

    this._onListUsers = this._onListUsers.bind(this);
    this._onLogin = this._onLogin.bind(this);

    this._onAddGoal = this._onAddGoal.bind(this);

    this._onAdd1 = this._onAdd1.bind(this);
    this._onDel1 = this._onDel1.bind(this);

    //this._getCoordinates = this._getCoordinates.bind(this);

    this._onChangeName = this._onChangeName.bind(this);
    this._onChangeAvatar = this._onChangeAvatar.bind(this);

    this._name = new EditableText("EditableTextName");
    this._avatarUrl = new EditableText("EditableTextURL");
    this._dynamicList = new DynamicList("Follow User");

    // Google authentication
    this._gs = null;
    this._onError = this._onError.bind(this);
    this._onSignIn = this._onSignIn.bind(this);
    this._onSignOut = this._onSignOut.bind(this);

    this._canvasOnClick = this._canvasOnClick.bind(this);
  }

  async setup() {
    // Setting up authentication
    this._gs = await GoogleSignin.init(CLIENT_ID);
    //document.querySelector("#signout").addEventListener("click", this._onSignOut);
    this._gs.renderSignIn("signin", { longtitle: true, theme: "dark", onsuccess: this._onSignIn, onfailure: this._onError });

    //this._loginForm = document.querySelector("#loginForm");
    //this._loginForm.login.addEventListener("click", this._onLogin);
    //this._loginForm.listUsers.addEventListener("click", this._onListUsers);
    document.querySelector("#listUsers").addEventListener("click", this._onListUsers);

    this._addGoalContainer = document.querySelector("#submitID");
    this._addGoalContainer.addEventListener("click", this._onAddGoal);


    this._avatarUrl.addToDOM(document.querySelector("#avatarContainer"), this._onChangeAvatar);

    this._name.addToDOM(document.querySelector("#nameContainer"), this._onChangeName);

    this._dynamicList.addToDOM(document.querySelector("#followContainer"), this._onAdd1, this._onDel1);

    let canvas = document.getElementById("canvas");
    // Method to obtain coordinates taken from: https://stackoverflow.com/questions/46107009/get-x-y-onclick-chart-coordinates-in-chartjs
    canvas.addEventListener("click", this._canvasOnClick);

  }

  async _canvasOnClick(e) {
    let activePoint = window.myScatter.getElementAtEvent(e);
    console.log(activePoint)
    if (activePoint.length === 0){
      var yTop = window.myScatter.chartArea.top;
      var yBottom = window.myScatter.chartArea.bottom;

      var yMin = window.myScatter.scales['y-axis-1'].min;
      var yMax = window.myScatter.scales['y-axis-1'].max;
      //var newY = 0;

      if (event.offsetY <= yBottom && event.offsetY >= yTop) {
          this._newY = Math.abs((event.offsetY - yTop) / (yBottom - yTop));
          this._newY = (this._newY - 1) * -1;
          this._newY = this._newY * (Math.abs(yMax - yMin)) + yMin;
      };

      var xTop = window.myScatter.chartArea.left;
      var xBottom = window.myScatter.chartArea.right;
      var xMin = window.myScatter.scales['x-axis-1'].min;
      var xMax = window.myScatter.scales['x-axis-1'].max;
      //var newX = 0;

      if (event.offsetX <= xBottom && event.offsetX >= xTop) {
          this._newX = Math.abs((event.offsetX - xTop) / (xBottom - xTop));
          this._newX = this._newX * (Math.abs(xMax - xMin)) + xMin;
      };
      console.log(this._newX, this._newY)
      document.querySelector("#instruction").classList.add("hidden");
      document.querySelector("#addGoalContainer").classList.remove("hidden");
      let urgent = "Non-Urgent";
      let important = "Non-Important";
      if (this._newX > 0) {
        important = "Important"
      }
      if (this._newY > 0) {
        urgent = "Urgent"
      }
      document.querySelector("#goalType").textContent = " " + urgent + ", " + important;
      document.querySelector("#xCoordinate").textContent = this._newX;
      document.querySelector("#yCoordinate").textContent = this._newY;
    } else {

      //myScatter.config.data.datasets[activePoint[0]._datasetIndex][activePoint[0]._index].pop();
      //let arr =
      //delete myScatter.config.data.datasets[activePoint[0]._datasetIndex].data[activePoint[0]._index]
      console.log(myScatter.config.data.datasets[activePoint[0]._datasetIndex].data[activePoint[0]._index].label[0])
      let post = myScatter.config.data.datasets[activePoint[0]._datasetIndex].data[activePoint[0]._index].label[0];
      let userid = document.querySelector("#idContainer").textContent;
      await User.deletePost(userid, post);
      myScatter.update();
      this._user = await User.loadOrCreate(userid);
      console.log(this._user)
      this._loadProfile();
    }
  }

  async _onAdd1(id) {
    await User.addFollow(this._user.id, id);
    this._user = await User.loadOrCreate(this._user.id);
    this._loadProfile();
  }

  async _onDel1(id) {
    await User.deleteFollow(this._user.id, id);
    this._user = await User.loadOrCreate(this._user.id);
    this._loadProfile();
  }

  async _onAddGoal(event) {

    event.preventDefault();
    //You should set this._user and call loadProfile
    let form = document.getElementById("formID");
    let goal = form.elements[0].value;
    //let dateStarted = form.elements[1].value;
    console.log(goal);
    let x = document.querySelector("#xCoordinate").textContent;
    let y = document.querySelector("#yCoordinate").textContent;
    await this._user.makePost(goal, x, y);
    this._loadProfile();
  }

  _onChangeName(text) {
    //alert(`${text.id} changed to ${text.value}, calling save function`);
    this._user.name = text.value;
    this._user.save();
    this._loadProfile();
  }

  _onChangeAvatar(text) {
    //alert(`${text.id} changed to ${text.value}, calling save function`);
    this._user.avatarURL = text.value;
    this._user.save();
    this._loadProfile();
  }
  /*
  _getAvatar(user) {
    let url = user.avatarURL;
    if (!url) url = "images/default.png";
    return url;
  }
  */

  async _loadProfile() {

    document.querySelector("#instruction").classList.remove("hidden");
    document.querySelector("#addGoalContainer").classList.add("hidden");
    document.querySelector("#welcome").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");
    document.querySelector("#idContainer").textContent = this._user.id;

    if (this._user.avatarURL !== null) {
      this._avatarUrl.setValue(this._user.avatarURL);
    }
    if (this._user.name !== null) {
      this._name.setValue(this._user.name);
    }
    //console.log(this)
    document.querySelector(".avatar").src = this._user.avatarURL;

    let followings = this._user.following;
    this._dynamicList.setList(followings);

    let ctx = document.getElementById('canvas').getContext('2d');

    // Taken and modified from: https://stackoverflow.com/questions/57567325/add-background-text-in-chartjs
    let myLineExtend = Chart.controllers.line.prototype.draw;
    Chart.helpers.extend(Chart.controllers.line.prototype, {
      draw: function() {
        myLineExtend.apply(this, arguments);
        this.chart.chart.ctx.textAlign = "center"
        this.chart.chart.ctx.font = "20px Arial black";
        this.chart.chart.ctx.fontcolor = "grey";
        let mw = document.getElementById('canvas').width/4;
        let mh = document.getElementById('canvas').height/4;
        //console.log(mw, mh);
        this.chart.chart.ctx.fillText("Urgent, Important", 1.5*mw, 0.7*mh);
        this.chart.chart.ctx.fillText("Urgent, Non-Important", 0.7*mw, 0.7*mh)
        this.chart.chart.ctx.fillText("Non-Urgent, Non-Important", 0.7*mw, 1.5*mh)
        this.chart.chart.ctx.fillText("Non-Urgent, Important", 1.5*mw, 1.5*mh)
      }
    });

    let posts = await this._user.getFeed();
    window.myScatter = new Chart(ctx, this._createGraph(posts));
    //window.myScatter = new Chart(ctx, this._createGraph(user));

  }

  async _onListUsers() {
    let users = await User.listUsers();
    let usersStr = users.join("\n");
    if (this._user.id === "Jason Ah Chuen") {
      alert(`List of users:\n\n${usersStr}`);
    } else {
      alert("Permission Denied. Ask friend for their user ids to follow them.");
    }
  }

  async _onLogin() {
    //event.preventDefault();
    //let id = this._loginForm.elements["userid"].value;
    let { name, email } = this._gs.getProfile();
    console.log(name, email);
    //let id = document.querySelector("#userid").value;
    let id = name;
    this._user = await User.loadOrCreate(id);
    this._loadProfile();
  }

  _randomColor(alpha) {
    return String('rgba(' + Math.round(Math.random() * 255) + ',' +
    Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + alpha + ')');
  }

  _generateData(goals, key) {
    let data = []
    for (let goal of goals) {
      data.push({
        x: goal.x,
        y: goal.y,
        label: [goal.text, new Date(goal.time), key]
      });
    }
    return data
  }

  _generateDatasets(posts) {
    let datasets = [];
    let dict = {};
    for (let [key, val] of Object.entries(posts)) {
      for (let i = 0; i < val.length; i++) {
        let post = val[i];
        if (dict[post.user.id] === undefined) {
          dict[post.user.id] = [post];
        } else {
          dict[post.user.id].push(post);
        }
      }
    }
    console.log(dict);
    for (let [key, posts] of Object.entries(dict)) {
      let curr_dataset = {};
      curr_dataset.label = key + "'s goals'";
      curr_dataset.data = this._generateData(posts, key);
      datasets.push(curr_dataset);
    }
    console.log(datasets);
    return datasets;
  }

  _randomColor(alpha) {
    return String('rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + alpha + ')');
  }

  _createGraph(posts) {
    //console.log(posts)
    let config = {
      type: 'scatter',
      data: {
        datasets: this._generateDatasets(posts)
      },
      options: {
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              //console.log(tooltipItem)
              //console.log(data)
              let goal = data.datasets[tooltipItem.datasetIndex]
              return [`User: ${goal.data[tooltipItem.index].label[2]}`, `Goal: ${goal.data[tooltipItem.index].label[0]}`, `Date started: ${goal.data[0].label[1]}`];
            }
          }
        },

        events: ['click', 'mousemove'],

        title: {
          display: true,
          text: "Eisenhower Matrix"
        },

        scales: {
          xAxes: [{
            ticks: {
              suggestedMin: -10,
              suggestedMax: 10
            },
            type: "linear",
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Important'
            },
          }, ],
          yAxes: [{
            ticks: {
              suggestedMin: -10,
              suggestedMax: 10
            },
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Urgent'
            },
          }]
        },
        responsive: true,
        maintainAspectRatio: true
      }
    };

    config.data.datasets.forEach(function (dataset) {
        let color = String('rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + 0.5 + ')');
        dataset.borderColor = color;
        dataset.backgroundColor = color;
        dataset.pointBorderColor = color;
        dataset.pointBackgroundColor = color;
        dataset.pointRadius = 7;
        dataset.pointBorderWidth = 2;
        dataset.pointHoverRadius = 8;
    });

    return config;
  }

  _onError() {
    alert("Error while signing in");
  }

  _onSignIn() {
    this._onLogin();
  }

  async _onSignOut() {
    await this._gs.signOut();
    //document.querySelector("#loginForm").classList.remove("hidden");
    //document.querySelector("#profile").classList.add("hidden");
  }

}

let app = new App();
app.setup();
