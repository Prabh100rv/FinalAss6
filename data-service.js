const Sequelize = require('sequelize');

var sequelize = new Sequelize('hxcauiig', 'hxcauiig', 'zBa0PWfGsuaKu6gkvw6isR88WCwLeChX', {
    host: 'peanut.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }
    , query: { raw: true }
});

let Student = sequelize.define('Student', {
    studentID: {
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    firstName:Sequelize.STRING,
    lastName:Sequelize.STRING,
    email:Sequelize.STRING,
    phone:Sequelize.STRING,
    addressStreet:Sequelize.STRING,
    addressCity:Sequelize.STRING,
    addressState:Sequelize.STRING,
    addressPostal:Sequelize.STRING,
    isInternationalStudent:Sequelize.BOOLEAN,
    expectedCredential:Sequelize.STRING,
    status:Sequelize.STRING,
    registrationDate:Sequelize.STRING
},
{
    createdAt: false,
    updatedAt: false
});

let Program = sequelize.define('Program', {
    programCode: {
        type:Sequelize.STRING,
        primaryKey:true,
    },
    programName:Sequelize.STRING
},
{
    createdAt: false, 
    updatedAt: false 
});

//hasMany Relationship
Program.hasMany(Student, {foreignKey: 'program'});

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then( () => {
            resolve();
        }).catch(()=>{
            reject("unable to sync the database"); return;
        });
    });
}

module.exports.getAllStudents = function(){
    return new Promise(function (resolve, reject) {
        Student.findAll().then(function (data) {
            resolve(data);
        }).catch((err) => {
            reject("no results returned"); return; 
        });
    });
}

module.exports.getStudentsByStatus = function (status) {
    return new Promise( (resolve, reject) => {
       Student.findAll({
           where:{
               status: status
           }
       })
       .then((data) => {
           resolve(data);
       })
       .catch((err) => {
           reject("no results returned");
           return;
       });
   });
};

module.exports.getStudentsByProgramCode = function (program) {
    return new Promise( (resolve, reject) => {
       Student.findAll({
           where: {
               program: program 
           }
       })
       .then((data) => {
           resolve(data);
       })
       .catch((err) => {
           reject("no results returned");
           return;
       });
   });
};

module.exports.getStudentsByExpectedCredential = function (credential) {
    return new Promise(function (resolve, reject) {
        Student.findAll({
            where: {
                expectedCredential: credential
            }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned"); 
            return;
        });
    });
};

module.exports.getStudentById = function (id) {
    return new Promise(function (resolve, reject) {
        Student.findAll({
            where: {
                studentID: id
            }
        }).then(function (data) {
            resolve(data[0]);
        }).catch(() => {
            reject("no results returned"); return;
        });
    });

};

module.exports.addStudent = function (studentData) {
    return new Promise( (resolve, reject) => {
        studentData.isInternationalStudent = (studentData.isInternationalStudent) ? true : false;

        for (var i in studentData)
        {
            if (studentData[i] == "") { studentData[i] = null; }
        }

        Student.create ({
            firstName:studentData.firstName,
            lastName:studentData.lastName,
            email:studentData.email,
            phone:studentData.phone,
            addressStreet:studentData.addressStreet,
            addressCity:studentData.addressCity,
            addressState:studentData.addressState,
            addressPostal:studentData.addressPostal,
            isInternationalStudent:studentData.isInternationalStudent,
            expectedCredential:studentData.expectedCredential,
            status:studentData.status,
            registrationDate:studentData.registrationDate
        })
       .then((data)=>{
            resolve(data);
        })
       .catch((err)=>{
            reject('unable to create Student');
        })
   });
};

module.exports.updateStudent = function (studentData) { 
    return new Promise(function (resolve, reject) {
 
        studentData.isInternationalStudent = (studentData.isInternationalStudent) ? true : false;
 
        for (var prop in studentData) {
            if (studentData[prop] == '')
                studentData[prop] = null;
        } 
 
        Student.update(studentData, {
            where: { studentID: studentData.studentID } 
        }).then(() => {
            resolve();
        }).catch((e) => {
            reject("unable to update student"); return;
        });
    }); 
}; 

module.exports.deleteStudentById = function(id){
    return new Promise(function (resolve, reject) { 
        Student.destroy({
            where: {
                studentID: id
            }
        }).then(function () {
            resolve();
        }).catch((err) => {
            reject("unable to delete student"); return;
        });
    });
}

module.exports.getInternationalStudents = function () {
    return new Promise(function (resolve, reject) {
        Student.findAll({
            where: {
                isInternationalStudent: true
            }
        }).then(function (data) {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
            return;
        });
    }); 
};  

module.exports.getPrograms = function(){
    return new Promise(function (resolve, reject) {
        Program.findAll().then(function (data) {
            resolve(data);
        }).catch((err) => {
            reject("no results returned"); return;
        });
    });
}

module.exports.addProgram = function(programData){
    return new Promise((resolve,reject) => {
        for (var i in programData) {
            if (programData[i] == "") { programData[i] = null; }
        }

        Program.create({
            programCode:programData.programCode,
            programName:programData.programName
        })
        .then(resolve(Program.findAll()))
        .catch(reject('unable to add Program'))
    })
};

module.exports.updateProgram = function(programData){
    return new Promise((resolve,reject) => {
        for (var i in programData) {
            if (programData[i] == "") { programData[i] = null; }
        }

        sequelize.sync()
        Program.update({
            programCode:programData.programCode,
            programName:programData.programName}, 
        {where: { 
            programCode: programData.programCode
        }})
        .then(() => {
            resolve();
        })
        .catch((err) => {
            reject("unable to update program");
            return;
        });
    })
};

module.exports.getProgramByCode = function(pcode){
    return new Promise((resolve,reject) => {
        Program.findAll({ 
            where: {
                programCode: pcode
            }
        })
        .then((data) => {
            resolve(data[0]);
        })
        .catch((err) => {
            reject("no results returned");
            return;
        });
    })
};

module.exports.deleteProgramByCode = function(pcode){
    return new Promise((resolve,reject) => {
        Program.destroy({
            where: {
                programCode: pcode
            }
        })
        .then(resolve())
        .catch(reject('unable to delete program'))
    })
};