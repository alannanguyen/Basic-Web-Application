/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including web sites) or distributed to other students.
* 
*  Name: Alanna Nguyen  Student ID: 135129179  Date: December 5, 2018
*
*  Online (Heroku) Link: https://gentle-fortress-68944.herokuapp.com/
*
********************************************************************************/ 
// Node Package Manager (npm) to install modules
const express = require("express"); //Node.js web application framework that provides a set of features for web and mobile applications.
const path = require("path"); //provides utilities for working with file and directory paths
const multer = require("multer"); //Handle multi-part form data. (photos/css by sending file and text)
const bodyParser = require("body-parser"); //Parse HTTP request body attach parameters to req.body property which contains data submitted from req (like multer but text only)
const fs = require("fs"); //module used to work directly with the file system
const exphbs = require("express-handlebars"); //Used to build HTML templates with variables that will be replaced with actual values
const clientSessions = require("client-sessions"); //keep sessions between the client and server on the client side
const dataService = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth.js");
const app = express();
// Middleware functions execute in the middle of (req, res) before route function executes

const HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

//setup to store files with file extensions
const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
}) //use diskStorage function to name files instead of default
const upload = multer({ storage: storage });

//used to map a specific view extension to a template engine
app.engine(".hbs", exphbs({ 
  extname: ".hbs", 
  defaultLayout: "main",
  helpers: { 
    navLink: function(url, options){
      return '<li' + 
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
  },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
          return options.inverse(this);
      } else {
          return options.fn(this);
      }
    }
  }
}));//use express handlebars for the view engine with the .hbs extension
app.set("view engine", ".hbs");

//.use is a method to add middleware to the application
app.use(express.static("public")); //folder that static resources load from

// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "assignment6_web322", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

// Ensure that all templates have access to a "session" object: {{session.userName}} 
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// Parse application/x-www-form-urlencoded for form data
app.use(bodyParser.urlencoded({ extended: true }));

// adds the property "activeRoute" to "app.locals" whenever the route changes
app.use(function(req, res, next){
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
  next();
});

// helper middleware function that checks if a user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req, res){
   res.render("home");
});

// setup another route to listen on /about
app.get("/about", function(req, res){
   res.render("about");
});

// define route to listen on /images/add
app.get("/images/add", ensureLogin, function(req, res){
  res.render("addImage");
});

// define POST route on /images/add
app.post("/images/add", ensureLogin, upload.single("imageFile"), function(req, res){
  res.redirect("/images");
});

// define route to listen on /images
app.get("/images", ensureLogin, function(req, res) {
  fs.readdir("./public/images/uploaded", function(err, items) {
  res.render("images", { images: items });
  })
});

// define route to listen on /employees
app.get("/employees", ensureLogin, function(req, res) {
  // optional status filter
  if (req.query.status) { // send data using query string using url
    dataService.getEmployeesByStatus(req.query.status)
    .then((data) => {
        res.render("employees", (data.length > 0) ? { employees: data } : { message: "no results" });
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  }
  // optional department filter
  else if (req.query.department) {
    dataService.getEmployeesByDepartment(req.query.department)
    .then((data) => {
      res.render("employees", (data.length > 0) ? { employees: data } : { message: "no results" });
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  }
  //optional manager filter
  else if (req.query.manager) {
    dataService.getEmployeesByManager(req.query.manager)
    .then((data) => {
      res.render("employees", (data.length > 0) ? { employees: data } : { message: "no results" });
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  }
  // full employee data
  else {
    dataService.getAllEmployees()
    .then((data) => {
      res.render("employees", (data.length > 0) ? { employees: data } : { message: "no results" });
    }).catch(() => {
      res.render("employees", { message: "no results" });
    })
  }
});

// define route to listen on optional /employees/:empNum
app.get("/employee/:empNum", ensureLogin, function(req, res) {

  // initialize an empty object to store the values
  let viewData = {};

  dataService.getEmployeeByNum(req.params.empNum)
  .then((data) => {
      if (data) {
        viewData.employee = data; //store employee data in the "viewData" object as "employee"
      } else {
        viewData.employee = null; // set employee to null if none were returned
      }
  }).catch(() => {
      viewData.employee = null; // set employee to null if there was an error 
  }).then(dataService.getDepartments)
  .then((data) => {
      viewData.departments = data; // store department data in the "viewData" object as "departments"

      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching 
      // viewData.departments object

      for (let i = 0; i < viewData.departments.length; i++) {
        if (viewData.departments[i].departmentId == viewData.employee.department) {
          viewData.departments[i].selected = true;
        }
      }

  }).catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
  }).then(() => {
      if (viewData.employee == null) { // if no employee - return an error
        res.status(404).send("Employee Not Found");
      } else {
        res.render("employee", { viewData: viewData }); // render the "employee" view
      }
  });
});
/* app.get("/employee/:empNum", function(req,res){
  // send data in url with params
    dataService.getEmployeesByNum(req.params.empNum)
    .then((data) => {
      res.render("employee", { employee: data });
    })
    .catch(() => {
      res.render("employee", { message: "no results" });
    });
}); */

// define route to listen on /employees/add
app.get("/employees/add", ensureLogin, function(req, res){
  dataService.getDepartments()
  .then((data) => {
    res.render("addEmployee", { departments: data });
  }).catch (() => {
    res.render("addEmployee", { departments: [] });
  })
});

// define POST route on /employees/add
app.post("/employees/add", ensureLogin, function(req, res){
  dataService.addEmployee(req.body)
  .then(() => {
    res.redirect("/employees");
  }).catch((err) => {
    res.json({ message: err });
  })
});

// define POST route on /employee/update
app.post("/employee/update", ensureLogin, function(req, res) {
  dataService.updateEmployee(req.body)
  .then(() => {
    res.redirect("/employees");
  }).catch((err) => {
    res.json({ message: err });
  });
});

// define route to listen on optional /employees/delete/:empNum
app.get("/employees/delete/:empNum", ensureLogin, function(req, res) {
  dataService.deleteEmployeeByNum(req.params.empNum)
  .then(() => {
    res.redirect("/employees");
  }).catch(() => {
    res.status(500).send("Unable to Remove Employee / Employee not found");
  });
})

// define route to listen on /managers
/*app.get("/managers", function(req,res){
  dataService.getManagers()
  .then((data) => {
    res.json(data);
  })
  .catch((err) => {
    res.json({ message: err });
  })
});*/

// define route to listen on /departments
app.get("/departments", ensureLogin, function(req, res) {
  dataService.getDepartments()
  .then((data) => {
    res.render("departments", (data.length > 0) ? { departments:data } : { message:"no results" });
  }).catch(() => {
    res.render("departments", { message: "no results" });
  })
});

// define route to listen on /departments/add
app.get("/departments/add", ensureLogin, function(req, res) {
  res.render("addDepartment");
});

// define POST route on /departments/add
app.post("/departments/add", ensureLogin, function(req, res) {
  dataService.addDepartment(req.body)
  .then(() => {
    res.redirect("/departments");
  }).catch((err) => {
    res.json({ message: err });
  })
});

// define POST route on /department/update
app.post("/department/update", ensureLogin, function(req, res) {
  dataService.updateDepartment(req.body)
  .then(() => {
    res.redirect("/departments");
  }).catch((err) => {
    res.json({ message: err });
  });
});

// define route to listen on optional /department/:departmentId
app.get("/department/:departmentId", ensureLogin, function(req, res) {
  // send data in url with params
    dataService.getDepartmentById(req.params.departmentId)
    .then((data) => {
      if (data == null) {
        res.status(404).send("Department Not Found");
      }
      res.render("department", { department: data });
    }).catch(() => {
      res.status(404).send("Department Not Found");
    });
});

// define route to listen on optional /departments/delete/:departmentId
app.get("/departments/delete/:departmentId", ensureLogin, function(req, res) {
  // send data in url with params
  dataService.deleteDepartmentById(req.params.departmentId)
  .then(() => {
    res.redirect("/departments");
  }).catch(() => {
    res.status(500).send("Unable to Remove Department / Department not found");
  });
});

// define the "/login" route
app.get("/login", function(req, res) {
  res.render("login");
});

// define the "/register" route
app.get("/register", function(req, res) {
  res.render("register");
});

// define the "/register" POST route
app.post("/register", function(req, res) {
  dataServiceAuth.registerUser(req.body)
  .then(() => {
    res.render("register", {successMessage: "User created"});
  })
  .catch((err) => {
    res.render("register", {errorMessage: err, userName: req.body.userName});
  });
});

// define the "/login" POST route
app.post("/login", function(req, res) {
  req.body.userAgent = req.get('User-Agent');
  dataServiceAuth.checkUser(req.body)
  .then((user) => {
    req.session.user = {
      userName: user.userName,// authenticated user's userName
      email: user.email,// authenticated user's email
      loginHistory: user.loginHistory// authenticated user's loginHistory
    }
    res.redirect('/employees');
  })
  .catch((err) => {
    res.render("login", {errorMessage: err, userName: req.body.userName});
  });
});

// define the "/logout" route
app.get("/logout", function(req, res) {
  req.session.reset(); // Log a user out by destroying their session
  res.redirect('/');
});

// define the "/userHistory" route
app.get("/userHistory", ensureLogin, function(req, res) {
  res.render("userHistory");
});

//catch all other requests that don't match existing route handlers
app.use(function(req, res) {
  res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
dataService.initialize()
.then(dataServiceAuth.initialize)
.then(() => {
  app.listen(HTTP_PORT, onHttpStart);
}).catch((err) => {
  console.log("Unable to start server: " + err);
});