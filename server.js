/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca Academic
   Policy.  No part of this assignment has been copied manually or electronically
   from any other source (including 3rd party web sites) or distributed to other
   students.
*
*  Name: Prabhjot Singh ** Student ID: 159760214 ** Date: 31/10/2022
*
*  Online (Cyclic) Link: https://tame-gray-scorpion-tie.cyclic.app
*
********************************************************************************/
const express = require("express");
const path = require('path');
const data = require("./data-service.js");
const fs = require('fs');
const multer = require('multer');
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
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>'; },
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
    res.render(path.join(__dirname, "/views/addStudent.hbs"));
});

app.get("/images", (req,res) => {
    fs.readdir("./public/images/uploaded", function(err, items) {
        res.render("images", { data: items });
    });
});

app.get("/students", (req, res) => {
    if (req.query.status) {
        data.getStudentsByStatus(req.query.status).then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    } else if (req.query.program) {
        data.getStudentsByProgramCode(req.query.program).then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    } else if (req.query.credential) {
       data.getStudentsByExpectedCredential(req.query.credential).then((data) => {
            res.render("students", {students: data});
       }).catch((err) => {
            res.render("students", {message: "no results"});
       });
    } else {
        data.getAllStudents().then((data) => {
            res.render("students", {students: data});
        }).catch((err) => {
            res.render("students", {message: "no results"});
        });
    }
});

app.get("/student/:studentID", (req, res) => {
    data.getStudentById(req.params.studentID).then((data) => {
        res.render("student", {student: data})
    }).catch((err) => {
        res.render("student", {message: "no results"});
    });
});

// app.get("/intlstudents", (req,res) => {
//     data.getInternationalStudents().then((data)=>{
//         res.render("students", {message: "no results"});
//     });
// });

app.get("/programs", (req,res) => {
    data.getPrograms().then((data)=>{
        res.render("programs", {programs: data});
    });
});

app.post("/students/add", (req, res) => {
    data.addStudent(req.body).then(()=>{
      res.redirect("/students");
    });
});

app.post("/student/update", (req, res) => {
    data.addStudent(req.body).then(()=>{
    res.redirect("/students");
    })
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
