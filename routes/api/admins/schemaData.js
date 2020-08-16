const router = require('express').Router();
const schemaDataCntrl = require('../../../controllers/schemaDataCntrl')
const adminAuth = require('../../adminAuth');
var multer = require('multer')
const schemaModel = require('../../../models/schemas');
const mysql = require('mysql');
const dbConnection = require('../../../config/db');
var multerReqValidator = function (req, res, next) {
    let name = req.headers.name;
    schemaModel.isValidSchema({ name: name }).then(schema => {
        if (!schema) {
            return res.status(422).json({ "success": false, error: { name: "Table Name selected is not found" }, data: {} })
        }

        let connection = mysql.createConnection(dbConnection.mysqlConn);
        let sql = 'SHOW TABLES LIKE "' + name + '"';
        connection.query(sql, (error, dbConnTable) => {
            if (error) {
                res.status(500).json({ "success": false, error: error, data: {} });
            } else {
                if (!dbConnTable.length) {
                    return res.status(422).json({ "success": false, error: { name: "Table Name selected is not found" }, data: {} })
                }
            }
        });

        next();
    });
}

var upload = multer({
    dest: 'uploads/', fileFilter: function (req, file, cb) {
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return cb(new Error('Wrong extension type'));
        }
        return cb(null, true);
    }
})

router.post('/', adminAuth.required, multerReqValidator, upload.single('file'), schemaDataCntrl.create);

module.exports = router;