const schemaModel = require('../models/schemas');
const userDefinedTablesModel = require('../models/userDefinedTables');
const { body, param, validationResult } = require('express-validator/check');
const mongoose = require('mongoose');
const mysql = require('mysql');
const dbConnection = require('../config/db');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('name', "Table Name is required").exists(),
                body('name', "Table Name can only have alphabets").isAlpha(),
                body('schemaIdentifier', "Table ID is required").exists(),
                body('status', "Status is required").exists().isIn(["active", "inactive"]),
                body('name').custom(val => {
                    return schemaModel.isValidSchema({ name: val }).then(schema => {
                        if (schema) {
                            return Promise.reject('Table Name already taken');
                        }
                    });
                }),
                body('schemaIdentifier').custom(val => {
                    return schemaModel.isValidSchema({ schemaIdentifier: val }).then(schema => {
                        if (schema) {
                            return Promise.reject('Table ID already taken');
                        }
                    });
                })
            ]
            break;

        case 'update':
            return [
                body('name', "Table Name is required").exists(),
                body('name', "Table Name can only have alphabets").isAlpha(),
                body('schemaIdentifier', "Table ID is required").exists(),
                body('status', "Status is required").exists().isIn(["active", "inactive"]),
                body().custom(val => {
                    return schemaModel.isValidSchema({ schemaIdentifier: val.schemaIdentifier }).then(schema => {
                        if (!schema) {
                            return Promise.reject('Table details doesnot exists');
                        }
                    });
                })
            ]

            break;

        case 'delete':
            return [
                param('schemaIdentifier').custom(val => {
                    return schemaModel.isValidSchema({ schemaIdentifier: val }).then(schema => {
                        if (!schema) {
                            return Promise.reject('Invalid table details sent');
                        }
                    });
                })
            ]

            break;
    }
}

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${param} : ${msg}`;
};

exports.create = async (req, res) => {
    try {
        const result = await validationResult(req).formatWith(errorFormatter);
        if (!result.isEmpty()) {
            res.status(422).json({ "success": false, error: result.array()[0], data: {} });
            return;
        }
        let tableName = req.body.name;
        req.body.organization = req.admin.organization;

        let connection = mysql.createConnection(dbConnection.mysqlConn);
        connection.connect(function (err) {
            if (err) {
                res.status(500).json({ "success": false, error: {"message": "Error connecting Database"}, data: {} });
            } else {
                schemaModel.create(req.body, (err, result) => {
                    if (err) {
                        res.status(500).json({ "success": false, error: err, data: {} });
                    } else {
                        let sql = 'SHOW TABLES LIKE "' + tableName + '"';
                        connection.query(sql, (error, results) => {
                            if (error) {
                                res.status(500).json({ "success": false, error: error, data: {} });
                            } else {
                                if (results.length) {
                                    schemaModel.remove({ name: tableName }, (err, result) => { });
                                    return res.status(409).json({ "success": false, error: 'Table Already Exists', data: {} });
                                } else {
                                    let sql = "CREATE TABLE " + tableName + " (name VARCHAR(255), address VARCHAR(255))";
                                    connection.query(sql, function (err, result) {
                                        if (error) {
                                            schemaModel.remove({ name: tableName }, (err, result) => { });
                                            res.status(500).json({ "success": false, error: err, data: {} });
                                        } else {
                                            res.status(201).json({ "success": true, error: {}, data: result, message: "Table created successfully" });
                                        }

                                    });
                                }
                            }
                        });
                    }
                });
            }
        });

    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} })
    }
}

exports.fetch = (req, res) => {
    try {
        schemaModel.find({ organization: req.admin.organization }, { schemaIdentifier: 1, name: 1, status: 1, _id: 0 }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                res.status(200).json({ "success": true, error: {}, data: result });
            }
        });

    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} });
    }
}

exports.fetchActive = (req, res) => {
    try {
        schemaModel.find({ organization: req.admin.organization, status: "active" }, { schemaIdentifier: 1, name: 1, status: 1, _id: 0 }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                res.status(200).json({ "success": true, error: {}, data: result });
            }
        });

    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} });
    }
}

exports.update = async (req, res) => {
    try {
        const validationOut = await validationResult(req).formatWith(errorFormatter);
        if (!validationOut.isEmpty()) {
            res.status(422).json({ "success": false, error: validationOut.array()[0], data: {} });
            return;
        }
        let tableName = req.body.name;
        req.body.organization = req.admin.organization;

        schemaModel.findOne({ schemaIdentifier: req.body.schemaIdentifier, organization: req.body.organization }, {}, (err, existing) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                if (existing) {
                    let renameCollection = false;
                    let toBeUpdated = { status: req.body.status };
                    let updateschemaName;
                    if (existing.name == tableName) {
                        updateschemaName = {}
                    } else {
                        renameCollection = true;
                        updateschemaName = { name: req.body.name };
                    }

                    schemaModel.update({ _id: existing._id }, toBeUpdated, (err, updated) => {
                        if (err) {
                            res.status(500).json({ "success": false, error: err, data: {} });
                        } else {
                            if (renameCollection) {
                                let connection = mysql.createConnection(dbConnection.mysqlConn);
                                let sql = 'SHOW TABLES LIKE "' + existing.name + '"';
                                connection.query(sql, (error, results) => {
                                    if (error) {
                                        res.status(500).json({ "success": false, error: error, data: {} });
                                    } else {
                                        if (results.length) {
                                            let sql = "RENAME TABLE " + existing.name + " TO " + tableName;
                                            connection.query(sql, function (err, result) {
                                                if (error) {
                                                    res.status(500).json({ "success": false, error: error, data: {} });
                                                } else {
                                                    schemaModel.update({ _id: existing._id }, updateschemaName, (err, updated) => {
                                                        res.status(201).json({ "success": true, error: {}, data: result, message: "Table updated successfully" });
                                                    });
                                                }
                                            });
                                        } else {
                                            res.status(400).json({ "success": true, error: {}, data: {}, message: "Table doesnot exists" });
                                        }
                                    }
                                });
                            } else {
                                res.status(200).json({ "success": true, error: {}, data: {} });
                            }
                        }
                    });
                } else {
                    res.status(204).json({ "success": false, error: 'Table information not found', data: {} });
                }
            }
        });
    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} })
    }
}

exports.delete = async (req, res) => {
    try {
        const validationOut = await validationResult(req).formatWith(errorFormatter);
        if (!validationOut.isEmpty()) {
            res.status(422).json({ "success": false, error: validationOut.array()[0], data: {} });
            return;
        }

        schemaModel.findOne({ organization: req.admin.organization, schemaIdentifier: req.params.schemaIdentifier }, { schemaIdentifier: 1, name: 1, status: 1 }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                if(result){
                    let connection = mysql.createConnection(dbConnection.mysqlConn);
                    let sql = 'SHOW TABLES LIKE "' + result.name + '"';
                    connection.query(sql, (error, dbConnTable) => {
                        if (error) {
                            res.status(500).json({ "success": false, error: error, data: {} });
                        } else {
                            
                                let sql = "DROP TABLE " + result.name;
                                connection.query(sql, function (err, dbConn) {
                                    if (error) {
                                        res.status(500).json({ "success": false, error: error, data: {} });
                                    } else {
                                        schemaModel.remove({ _id: result._id }, (err, removed) => {
                                            if (err) {
                                                res.status(500).json({ "success": false, error: err, data: {} });
                                            } else {
                                                res.status(200).json({ "success": true, error: {}, data: {}, message : "Table deleted successfully" });
                                            }
                                        });
                                    }
                                }); 
                        }
                    });
                }else{
                    res.status(204).json({ "success": true, error: {}, data: {}, message: "Table doesnot exists" });
                }
            }
        });
    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} });
    }
}