const schemaModel = require('../models/schemas');
const fs = require('fs');
const XLSX = require('xlsx');
const { header, body, validationResult } = require('express-validator/check');
const userDefinedTablesModel = require('../models/userDefinedTables');
const async = require('async');
const _ = require('lodash');
const mysql = require('mysql');
const dbConnection = require('../config/db');
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
        let columnNames = [];
        let onlyNames = [];
        let tableName = req.headers.name;
        async.forEach(json, function (row, callback) {
            columnNames = columnNames.concat(Object.keys(row));
            onlyNames  = onlyNames.concat(Object.keys(row));
            callback();
        }, function (err, done) {
            if (err) {
                res.status(500).json({ "success": false, error: {}, data: {} });
            } else {
                columnNames = _.uniq(columnNames);
                onlyNames = _.uniq(onlyNames);
                columnNames = columnNames.map(i => i + " VARCHAR(255)");
                columnNames.toString();
                let onlyNameString = onlyNames.toString();
                let connection = mysql.createConnection(dbConnection.mysqlConn);
                let sql = "DROP TABLE " + tableName;
                connection.query(sql, async (error, dbConnTable) => {
                    if (error) {
                        res.status(500).json({ "success": false, error: error, data: {} });
                    } else {
                        let sql = "CREATE TABLE " + tableName + " (" + columnNames + ")";
                        await connection.query(sql, function (err, result) {
                            if (error) {
                                res.status(500).json({ "success": false, error: err, data: {} });
                            } else {
                                let values = [];
                                let outerInc = 0;
                                async.forEach(json, function (data, innerCB) {
                                    if(values[outerInc] == undefined){
                                        values[outerInc] = [];
                                    }
                                    for (let index in onlyNames ) {
                                        values[outerInc].push([data[onlyNames[index]]]);
                                    }

                                    outerInc++;
                                    innerCB();
                                }, function (err, done) {
                                    if (err) {
                                        res.status(500).json({ "success": false, error: {}, data: {} });
                                    } else {
                                        connection.query("INSERT INTO "+tableName+" ("+onlyNameString+") VALUES ?", [values], function(err,result) {
                                            if(err) {
                                                res.status(500).json({ "success": false, error: {}, data: {} });
                                            }
                                           else {
                                            res.status(201).json({ "success": true, error: {}, data: result, message: "Table created successfully" });
                                            }
                                          });
                                    }
                                }); 
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} });
    }
}