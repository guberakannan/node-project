const schemaModel = require('../models/schemas');
const userDefinedTablesModel = require('../models/userDefinedTables');
const { body, validationResult } = require('express-validator/check');
const mongoose = require('mongoose');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('name', "Table Name is required").exists(),
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
                }),
            ]
            break;

        case 'update':
            return [
                body('name', "Table Name is required").exists(),
                body('schemaIdentifier', "Table ID is required").exists(),
                body('status', "Status is required").exists().isIn(["active", "inactive"]),
            ]

            break;

        case 'delete':
            return [
                // body('name', "Table Name is required").exists(),
                // body('schemaIdentifier', "Table ID is required").exists(),
                // body('status', "Status is required").exists().isIn(["active", "inactive"]),
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
        schemaModel.create(req.body, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                mongoose.connection.db.listCollections({ name: tableName })
                    .next(function (err, collinfo) {
                        if (err) {
                            return res.status(500).json({ "success": false, error: err, data: {} });
                        } else {
                            if (collinfo) {
                                schemaModel.remove({ name: tableName }, (err, result) => { });
                                return res.status(409).json({ "success": false, error: 'Table Already Exists', data: {} });
                            } else {
                                userDefinedTablesModel.create(tableName, { name: "New Table" }, (err, result) => {
                                    if (err) {
                                        schemaModel.remove({ name: tableName }, (err, result) => { });
                                        res.status(500).json({ "success": false, error: err, data: {} });
                                    } else {
                                        res.status(201).json({ "success": true, error: {}, data: result });
                                    }
                                });
                            }
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
                    var toBeUpdated;
                    if (existing.name == tableName) {
                        toBeUpdated = { status: req.body.status }
                    } else {
                        renameCollection = true;
                        toBeUpdated = { status: req.body.status, name: req.body.name };
                    }

                    schemaModel.update({ _id: existing._id }, toBeUpdated, (err, updated) => {
                        if (err) {
                            res.status(500).json({ "success": false, error: err, data: {} });
                        } else {
                            if (renameCollection) {
                                mongoose.connection.db.collection(existing.name).rename(tableName).then((renamed) => {
                                    res.status(200).json({ "success": true, error: {}, data: {} });
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

exports.delete = (req, res) => {
    try {
        schemaModel.findOne({ organization: req.admin.organization, schemaIdentifier: req.params.id }, { schemaIdentifier: 1, name: 1, status: 1 }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} });
            } else {
                mongoose.connection.db.dropCollection(result.name).then((dropped) => {
                    schemaModel.remove({_id : result._id}, (err, removed) => {
                        if(err){
                            res.status(500).json({ "success": false, error: err, data: {} });
                        }else{
                            res.status(200).json({ "success": true, error: {}, data: {} });
                        }
                    });
                });
            }
        });
    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} });
    }
}