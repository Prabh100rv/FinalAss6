/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca Academic
   Policy. No part of this assignment has been copied manually or electronically
   from any other source (including 3rd party web sites) or distributed to other
   students.
*
*  Name: Prabhjot Singh ** Student ID: 159760214 ** Date: 27/11/2022
*
*  Online (Cyclic) Link: https://frightened-worm-sweatsuit.cyclic.app/about

********************************************************************************/
const express = require("express");
const path = require('path');
const data = require("./data-service.js");
const fs = require('fs');
const multer = require('multer');
const bodyParser = require("body-parser");
const app = express();
const exphbs = require('express-handlebars');
const dataServiceAuth = require("./data-service-auth");
const clientSessions = require('client-sessions');

const HTTP_PORT = process.env.PORT || 8080;

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      }
});

const upload = multer({storage: storage})

app.engine('.hbs', exphbs.engine({ 
    extname: ".hbs", 
    defaultLayout: "main",
    helpers: {
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                 '><a href="' + url + '">' + options.fn(this) + '</a></li>'; },
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
}));
app.set('view engine', '.hbs');

app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(function(req, res, next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

app.use(clientSessions({
    cookieName: "session", 
    secret: "FinalAssignment6", 
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use((req,res,next) => {
    res.locals.session = req.session;
    next();
});

ensureLogin = (req,res,next) => {
    if (!(req.session.user)) {
        res.redirect("/login");
    }
    else { next(); }
};

app.get('/', (req, res) => {
    res.render(path.join(__dirname + "/views/home.hbs"));
});

app.get('/about', (req, res) => {
    res.render(path.join(__dirname + "/views/about.hbs"));
});

//******* Images ********
app.get("/images/add", ensureLogin, (req,res) => {
    res.render("addImage");
});

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req,res) =>{
    res.redirect("/images");
});

app.get("/images", ensureLogin, (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render("images", { data: items });
    });
});

//******* Students ********
app.get("/students/add", ensureLogin, (req,res) => {
    data.getPrograms().then((data)=>{
        res.render("addStudent", {programs: data});
    }).catch((err) => {
    res.render("addStudent", {programs: [] });
    });

});

app.post("/students/add", ensureLogin, (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students"); 
    }).catch((err)=>{
        res.status(500).send("Unable to Add the Student");
      });
});

app.get("/students", ensureLogin, (req, res) => {
    if (req.query.status) {
         data.getStudentsByStatus(req.query.status).then((data) => {
             res.render("students", {students:data});
         }).catch((err) => {
             res.render("students",{ message: "no results" });
         });
     } else if (req.query.program) {
         data.getStudentsByProgramCode(req.query.program).then((data) => {
             res.render("students", {students:data});
         }).catch((err) => {
             res.render("students",{ message: "no results" });
         });
     } else if (req.query.credential) {
         data.getStudentsByExpectedCredential(req.query.credential).then((data) => {
             res.render("students", {students:data});
         }).catch((err) => {
             res.render("students",{ message: "no results" });
         });
     } else {
         data.getAllStudents().then((data) => {
             res.render("students", {students:data});
         }).catch((err) => {
             res.render("students",{ message: "no results" });
         });
     }
 });

 app.get("/student/:studentId", ensureLogin, (req, res) => {
    let viewData = {};

    data.getStudentById(req.params.studentId).then((data) => {
        if (data) {
            viewData.student = data;
        } else {
            viewData.student = null;
        }
    }).catch(() => {
        viewData.student = null;
    }).then(data.getPrograms)
    .then((data) => {
        viewData.programs = data;
        for (let i = 0; i < viewData.programs.length; i++) {
            if (viewData.programs[i].programCode == viewData.student.program) {
                viewData.programs[i].selected = true;
            }
        }
    }).catch(() => {
        viewData.programs = []; 
    }).then(() => {
        if (viewData.student == null) { 
            res.status(404).send("Student Not Found");
        } else {
            res.render("student", { viewData: viewData }); 
        }
    }).catch((err)=>{
        res.status(500).send("Unable to Show Students");
      });
});

app.get("/intlstudents", ensureLogin, (req,res) => {
    data.getInternationalStudents().then((data)=>{
        res.json(data);
    });
});

app.post("/student/update", ensureLogin, (req, res) => {
    data.updateStudent(req.body).then(()=>{
    res.redirect("/students");
  }).catch((err)=>{
    res.status(500).send("Unable to Update the Student");
  });
  
});

app.get("/students/delete/:sid", ensureLogin, (req,res)=>{
    data.deleteStudentById(req.params.sid).then(()=>{
        res.redirect("/students");
    }).catch((err)=>{
        res.status(500).send("Unable to Remove Student / Student Not Found");
    });
});

//********** Programs *************
app.get("/programs/add", ensureLogin, (req,res) => {
    res.render(path.join(__dirname, "/views/addProgram.hbs"));
});

app.post("/programs/add", ensureLogin, (req, res) => {
    data.addProgram(req.body).then(()=>{
      res.redirect("/programs");
    }).catch((err) => {
        res.status(500).send("Unable to Add Program");
    });
});

app.get("/programs", ensureLogin, (req,res) => {
    data.getPrograms().then((data)=>{
        if(data.length > 0){
            res.render("programs", {programs: data});
        }
        else{
            res.render("programs", {message: "no results"});
        }
    }).catch((err) => {
        res.render("programs", {message: "no results"});
    });
});

app.get("/program/:programCode", ensureLogin, (req, res) => {
    data.getProgramByCode(req.params.programCode).then((data) => {
        res.render("program", {program: data});
    }).catch((err) => {
        res.status(404).send("Program Not Found");
    });
});

app.post("/program/update", ensureLogin, (req, res) => {
    data.updateProgram(req.body).then(()=>{
    res.redirect("/programs");
    }).catch((err) => {
        res.status(500).send("Unable to Update Programs");
    });
});

app.get('/programs/delete/:programCode', ensureLogin, (req,res) => {
    data.deleteProgramByCode(req.params.programCode).then(res.redirect("/programs"))
    .catch(err => res.status(500).send("(Unable to Remove Program / Program not found)"))
});

// ************* Account ***************
app.get("/login", (req,res) => {
    res.render("login");
});

app.get("/register", (req,res) => {
    res.render("register");
});

app.post("/register", (req,res) => {
    dataServiceAuth.registerUser(req.body)
    .then(() => res.render("register", {successMessage: "User created" } ))
    .catch (err => res.render("register", {errorMessage: err, userName:req.body.userName }) )
});

app.post("/login", (req,res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
    .then(user => {
        req.session.user = {
            userName:user.userName,
            email:user.email,
            loginHistory:user.loginHistory
        }
        res.redirect("/students");
    })
    .catch(err => {
        res.render("login", {errorMessage:err, userName:req.body.userName} )
    }) 
});

app.get("/logout", (req,res) => {
    req.session.reset();
    res.redirect("/login");
});

app.get("/userHistory", ensureLogin, (req,res) => {
    res.render("userHistory", {user:req.session.user} );
});

// ************* Intialize ***************
app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

data.initialize()
.then(dataServiceAuth.initialize)

.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});
  


