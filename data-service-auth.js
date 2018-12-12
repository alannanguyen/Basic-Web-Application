// MongoDB is an open source database that stores its data in BSON "Binary JSON" like format
const mongoose = require("mongoose"); // wraps up the Mongo driver and provides extra functionality for declaring schemas/models
const bcrypt = require('bcryptjs'); // for the one way encryption of passwords
const Schema = mongoose.Schema; // setup the Schema

// define the user schema
const userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb://an71:guyen8@ds151383.mlab.com:51383/web322_a6", { useNewUrlParser: true, useCreateIndex: true });
        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
            User = db.model("users", userSchema);// register the User model using the userSchema, using "users" collection in the db to store documents
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password != userData.password2) {
            reject("Passwords do not match");
        }
        else {
            bcrypt.genSalt(10, function(err, salt) { // Generate a "salt" using 10 rounds
                if (err) {
                    reject("There was an error encrypting the password");
                }
                else {
                    bcrypt.hash(userData.password, salt, function(err, hash) { // encrypt the userData.password
                        if (err) {
                            reject("There was an error encrypting the password");
                        }
                        else { 
                            // TODO: Store the resulting "hash" value in the DB
                            userData.password = hash;
                            let newUser = new User(userData); // create new user
                            newUser.save((err) => { // save new user
                                if (err) {
                                    if (err.code == 11000) {
                                        reject("User Name already taken");
                                    }
                                    else {
                                        reject("There was an error creating the user: " + err);
                                    }
                                }
                                else {
                                    resolve();
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName })
        .exec()
        .then((users) => {
            if (users.length == 0) {
                reject("Unable to find user: " + userData.userName);
            }// compare hashed db password to userData.password
            bcrypt.compare(userData.password, users[0].password)
            .then((res) => {// res === true if it matches and res === false if it does not match
                if (res === true) {
                    /*else if (users[0].password == userData.password) {*/
                    users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                    User.update({ userName: users[0].userName }, // the query to select which documents to update
                        { $set: { loginHistory: users[0].loginHistory } }, // the fields to set for the documents that match the query
                        { multi: false }) // option for if you want to update multiple matching documents or only the first match
                    .exec()
                    .then(() => {
                        resolve(users[0]);
                    })
                    .catch((err) => {
                        reject("There was an error verifying the user: " + err);
                    });
                    //CANNOT RETURN EMPTY PROMISE RESOLVE:
                    //TypeError: Cannot read property 'userName' of undefined 
                    //resolve();
                }
                else {
                    reject("Incorrect Password for user: " + userData.userName);
                }
            });
        })
        .catch((err) => {
            reject("Unable to find user: " + userData.userName);
        });
    });
};