/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca Academic
   Policy.  No part of this assignment has been copied manually or electronically
   from any other source (including 3rd party web sites) or distributed to other
   students.
*
*  Name: Prabhjot Singh ** Student ID: 159760214 ** Date: 18/11/2022
*
*  Online (Cyclic) Link: 
*
********************************************************************************/
const express = require("express");
const path = require('path');
const data = require("./data-service.js");
const fs = require('fs');
const multer = require('multer');
const bodyParser = require("body-parser");
const app = express();
const exphbs = require('express-handlebars');

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

app.get('/', (req, res) => {
    res.render(path.join(__dirname + "/views/home.hbs"));
});

app.get('/about', (req, res) => {
    res.render(path.join(__dirname + "/views/about.hbs"));
});

app.get("/images/add", (req,res) => {
    res.render(path.join(__dirname, "/views/addImage.hbs"));
});

app.get("/students/add", (req,res) => {
    data.getPrograms()
    .then(data => res.render("addStudent", {programs: data}))
    .catch(err => res.render("addStudent", {programs: null})); 
});

app.get("/programs/add", (req,res) => {
    res.render(path.join(__dirname, "/views/addProgram.hbs"));
});

app.get("/images", (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render("images", { data: items });
    });
});

app.get("/students", (req, res) => {
    if (req.query.status) {
        data.getStudentsByStatus(req.query.status).then((data) => {
            if (data.length > 0){
                res.render("students", {students: data});
            }
            else {
                res.render("students", {message: "no results"});
            }
        }).catch((err) => {
            res.render("student", {message: "no results"});
        });
    } else if (req.query.program) {
        data.getStudentsByProgramCode(req.query.program).then((data) => {
            if (data.length > 0){
                res.render("students", {students: data});
            }
            else {
                res.render("students", {message: "no results"});
            }
        }).catch((err) => {
            res.render("student", {message: "no results"});
        });
    } else if (req.query.credential) {
       data.getStudentsByExpectedCredential(req.query.credential).then((data) => {
            if (data.length > 0){
                res.render("students", {students: data});
            }
            else{
                res.render("students", {message: "no results"});
            }
       }).catch((err) => {
        res.render("student", {message: "no results"});
    });
    } else {
        data.getAllStudents().then((data) => {
            if (data.length > 0){
                res.render("students", {students: data});
            } 
            else {
                res.render("students", {message: "no results"});
            }
        }).catch((err) => {
            res.render("student", {message: "no results"});
        });
    }
});

app.get("/student/:studentId", (req, res) => {
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
        console.log(viewData);
        if (viewData.student == null) { 
            res.status(404).send("Student Not Found");
        } else {
            res.render("student", { viewData: viewData }); 
        }
    }).catch((err)=>{
        res.status(500).send("Unable to Show Students");
    });
});

app.get("/program/:programCode", (req, res) => {
    data.getProgramByCode(req.params.programCode).then((data) => {
        res.render("program", {program: data});
    }).catch((err) => {
        res.status(404).send("Program Not Found");
    });
});

app.get("/programs", (req,res) => {
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

app.get('/programs/delete/:programCode', (req,res) => {
    data.deleteProgramByCode(req.params.programCode).then(res.redirect("/programs"))
    .catch(err => res.status(500).send("(Unable to Remove Program / Program not found)"))
});

app.get('/students/delete/:studentID', (req,res) => {
    data.deleteStudentById(req.params.studentID).then(res.redirect("/students"))
    .catch(err => res.status(500).send("(Unable to Remove Student / Student not found)"))
});

app.post("/students/add", (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    }).catch((err) => {
        res.status(500).send("Unable to Add Student");
    });
});

app.post("/programs/add", (req, res) => {
    data.addProgram(req.body).then(()=>{
      res.redirect("/programs");
    }).catch((err) => {
        res.status(500).send("Unable to Add Program");
    });
});

app.post("/student/update", (req, res) => {
    data.updateStudent(req.body).then(()=>{
    console.log(data);
    res.redirect("/students")
}).catch((err) => {
    res.status(500).send("Unable to Update Students");
});
});

app.post("/program/update", (req, res) => {
    data.updateProgram(req.body).then(()=>{
    res.redirect("/programs");
    }).catch((err) => {
        res.status(500).send("Unable to Update Programs");
    });
});

app.post("/images/add", upload.single("imageFile"), (req,res) => {
    res.redirect("/images");
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});

