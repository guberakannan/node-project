const schemaModel = require('../models/schemas');
const mongoose = require('mongoose');
const fs = require('fs');
const XLSX = require('xlsx');
const { header, body, validationResult } = require('express-validator/check');
const db = require('../config/db');
const userDefinedTablesModel = require('../models/userDefinedTables');
const async = require('async');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                header('name', "Header name is req").exists(),
                header('name').custom(val => {
                    return schemaModel.isValidSchema({ name: val }).then(schema => {
                        if (!schema) {
                            return Promise.reject('Table Name selected is not found');
                        }
                    });
                }),
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

        let fileData = fs.readFileSync(req.file.path);
        let wb = XLSX.read(fileData, { type: 'buffer' });
        let ws = wb.Sheets[wb.SheetNames[0]]
        let json = XLSX.utils.sheet_to_json(ws);

        console.log(json)
        userDefinedTablesModel.remove(req.headers.name, {}, (err, removed) => {
            if (!err) {
                async.eachSeries(json, function (item, cb) {
                    userDefinedTablesModel.create(req.headers.name, item, (err, added) => {
                        if (err) {
                            return res.status(500).json({ "success": false, error: err, data: {} });
                        }
                        
                        if(added){
                            cb(null, null);
                        }
                        
                    }, function (done) {
                        console.log("cacasc")
                        res.status(201).json({ "success": true, error: {}, data: { message: "Updated successfully" } });

                    });
                });
            } else {
                res.status(500).json({ "success": false, error: err, data: {} });
            }
        });
    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} });
    }
}