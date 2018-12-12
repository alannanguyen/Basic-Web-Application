//Object-Relational Mapping ("ORM") framework
//maps "models" to tables and rows within database
//will automatically execute relevant SQL commands on the database
//whenever data using "models" (JavaScript objects) is updated
const Sequelize = require('sequelize');

// set up sequelize to point to postgres database
var sequelize = new Sequelize('ddl28j9e780jh6', 'wpftygxdqtinmd', 'be5bf0baa2bd97df5ba4009d210191e5e294e0f10208ce6ea68fc6611391838f', {
    host: 'ec2-54-83-8-246.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: true
    }
});

// Define a "Employee" model
var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING,
});

// Define a "Department" model
var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

// Associate Employee with Department & automatically create a foreign key
// relationship on "Employee" via a "department" field
Department.hasMany(Employee, { foreignKey: 'department' });

// Promise is result of asynchronous operation
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        sequelize.sync()// synchronize the Database with models and automatically add tables if it does not exist
        .then(() => {
            resolve();
        }).catch(() => {
            reject("unable to sync the database");
        });
    });
}

module.exports.getAllEmployees = function () {
    return new Promise(function (resolve, reject) {
        Employee.findAll()// fetch data from "Employee" table; search for multiple instances
        .then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.getEmployeesByStatus = function (status) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({// fetch data from "Employee" table, 'status' condition
            where: { status: status }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.getEmployeesByDepartment = function (department) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({// fetch data from "Employee" table, 'department' condition
            where: { department: department }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.getEmployeesByManager = function (manager) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({// fetch data from "Employee" table, 'employeeManagerNum' condition
            where: { employeeManagerNum: manager }
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.getEmployeeByNum = function (num) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({// fetch data from "Employee" table, 'employeeNum' condition
            where: { employeeNum: num }
        }).then((data) => {
            resolve(data[0]);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.addEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (const prop in employeeData) {
            if (employeeData[prop] == "") {
                employeeData[prop] = null;
            }
        }// create a new "Employee" and add it to the database
        Employee.create(employeeData)
        .then(() => {
            resolve();
        }).catch((err) => {
            reject("unable to create employee");
        });
    });
}

module.exports.updateEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (const prop in employeeData) {
            if (employeeData[prop] == "") {
                employeeData[prop] = null;
            }
        }// update "Employee" where employeeNum match
        Employee.update(employeeData, {
            where: { employeeNum: employeeData.employeeNum }
        })
        .then (() => {
            resolve();
        }).catch (() => {
            reject("unable to update employee");
        });
    });
}

module.exports.deleteEmployeeByNum = function (empNum) {
    return new Promise(function (resolve, reject) {
        Employee.destroy({// remove from the database where employeeNum match 
            where: { employeeNum: empNum }
        }).then (() => {
            resolve();
        }).catch (() => {
            reject();
        })
    });
}

/* module.exports.getManagers = function () {
    return new Promise(function (resolve, reject) {
        let managers = employees.filter(function(employees) {
            return employees.isManager == true;
        });
        if (managers.length == 0) {
            reject("no managers returned");
        }
        resolve(managers);
    });
} */

module.exports.getDepartments = function () {
    return new Promise(function (resolve, reject) {
        Department.findAll({//fetch data from "Department" table; search for multiple instances
        }).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.addDepartment = function (departmentData) {
    return new Promise(function (resolve, reject) {
        for (const prop in departmentData) {
            if (departmentData[prop] == "") {
                departmentData[prop] = null;
            }
        }// create a new "Department" and add it to the database
        Department.create(departmentData)
        .then(() => {
            resolve();
        }).catch((err) => {
            reject("unable to create department");
        });
    });
}

module.exports.updateDepartment = function (departmentData) {
    return new Promise(function (resolve, reject) {
        for (const prop in departmentData) {
            if (departmentData[prop] == "") {
                departmentData[prop] = null;
            }
        }// update "Department" where departmentId match
        Department.update(departmentData ,{
            where: { departmentId: departmentData.departmentId }
        }).then (() => {
            resolve();
        }).catch (() => {
            reject("unable to update department");
        });
    });
}

module.exports.getDepartmentById = function (id) {
    return new Promise(function (resolve, reject) {
        Department.findAll({// fetch data from "Employee" table, 'departmentId' condition
            where: { departmentId: id }
        }).then((data) => {
            resolve(data[0]);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

module.exports.deleteDepartmentById = function (id) {
    return new Promise(function (resolve, reject) {
        Department.destroy({// remove from the database where departmentId match 
            where: { departmentId: id }
        }).then(() => {
            resolve();
        }).catch(() => {
            reject();
        });
    });
}