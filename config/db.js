//Configure Mongoose
const mongoose = require('mongoose');
const mysql = require('mysql');
const db = {
    url : "mongodb://localhost/passportproject"
}
mongoose.connect(db.url, function(err, client) {
    if(err) {
        console.log(err)
    }
    exports.client = client; 
});

exports.db = db;

exports.mysqlConn = {
    host: 'kpitoday.czjvf16rxspy.us-east-2.rds.amazonaws.com',
    user: 'kpitoday',
    password: 'node-angular',
    database: 'kpitoday',
    connectionLimit: 100,
}