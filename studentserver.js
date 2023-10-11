const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const glob = require("glob");



const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Student Server API',
            version: '1.0.0',
        },
    },
    apis: ['studentserver.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

// Create a new student object
app.post('/students', function(req, res) {
    var record_id = new Date().getTime();
    var obj = {
        record_id: record_id,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        gpa: req.body.gpa,
        enrolled: req.body.enrolled,
    };
    var str = JSON.stringify(obj, null, 2);
    const dir = 'students';

    fs.access(dir, (err) => {
        if (err) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Directory created successfully!');
                }
            });
        } else {
            console.log('Directory already exists!');
        }
        if (checkStudentExists() == false) {
            fs.writeFile("students/" + record_id + ".json", str, function(err) {
                var rsp_obj = {};
                if (err) {
                    rsp_obj.record_id = -1;
                    rsp_obj.message = 'error - unable to create resource';
                    return res.status(200).send(rsp_obj);
                } else {
                    rsp_obj.record_id = record_id;
                    rsp_obj.message = 'successfully created';
                    return res.status(201).send(rsp_obj);
                }
            });
        } else {
            console.log("Student exists");
        }
    });
});

// Get a student by record ID
app.get('/students/:record_id', function(req, res) {
    var record_id = req.params.record_id;

    fs.readFile("students/" + record_id + ".json", "utf8", function(err, data) {
        if (err) {
            var rsp_obj = {};
            rsp_obj.record_id = record_id;
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        } else {
            return res.status(200).send(data);
        }
    });
});

// Get a student by last name
app.get('/students/by-lastname/:last_name', function(req, res) {
    var last_name = req.params.last_name;

    fs.readFile("students/" + last_name + ".json", "utf8", function(err, data) {
        if (err) {
            var rsp_obj = {};
            rsp_obj.last_name = last_name;
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        } else {
            var studentData = JSON.parse(data);
            return res.status(200).send(studentData);
        }
    });
});

function readFiles(files, arr, res) {
    fname = files.pop();
    if (!fname) return;
    fs.readFile(fname, "utf8", function(err, data) {
        if (err) {
            return res.status(500).send({ message: "error - internal server error" });
        } else {
            arr.push(JSON.parse(data));
            if (files.length == 0) {
                var obj = { students: arr };
                return res.status(200).send(obj);
            } else {
                readFiles(files, arr, res);
            }
        }
    });
}

// Get an array of all students
app.get('/students', function(req, res) {
    console.log("get students");
    var obj = {};
    var arr = [];
    filesread = 0;

    glob("students/*.json", null, function(err, files) {
        if (err) {
            return res.status(500).send({ message: "error - internal server error" });
        }
        readFiles(files, [], res);
    });
});

// Update an existing student by record ID
app.put('/students/:record_id', function(req, res) {
    var record_id = req.params.record_id;
    var fname = "students/" + record_id + ".json";
    var rsp_obj = {};
    var obj = {
        record_id: record_id,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        gpa: req.body.gpa,
        enrolled: req.body.enrolled,
    };

    var str = JSON.stringify(obj, null, 2);

    fs.stat(fname, function(err) {
        if (err == null) {
            fs.writeFile("students/" + record_id + ".json", str, function(err) {
                var rsp_obj = {};
                if (err) {
                    rsp_obj.record_id = record_id;
                    rsp_obj.message = 'error - unable to update resource';
                    return res.status(200).send(rsp_obj);
                } else {
                    rsp_obj.record_id = record_id;
                    rsp_obj.message = 'successfully updated';
                    return res.status(201).send(rsp_obj);
                }
            });
        } else {
            rsp_obj.record_id = record_id;
            const fs = require('fs');
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        }
    });
});

// Delete a student by record ID
app.delete('/students/:record_id', function(req, res) {
    var record_id = req.params.record_id;
    var fname = "students/" + record_id + ".json";

    fs.unlink(fname, function(err) {
        var rsp_obj = {};
        if (err) {
            rsp_obj.record_id = record_id;
            rsp_obj.message = 'error - resource not found';
            return res.status(404).send(rsp_obj);
        } else {
            rsp_obj.record_id = record_id;
            rsp_obj.message = 'record deleted';
            return res.status(200).send(rsp_obj);
        }
    });
});

function checkStudentExists(files, obj, fname, lname, res) {
    console.log("checkStudentExists");
    listOfStudents = obj;
    for (let recordId in listOfStudents) {
        let student = listOfStudents[recordId];
        if (student.first_name === firstName && student.last_name === lastName) {
            return true;
        }
    }
    return false;
}
app.listen(5678); // Start the server
console.log('Server is running...');
console.log('Webapp:   http://localhost:5678');
console.log('API Docs: http://localhost:5678/api-docs');