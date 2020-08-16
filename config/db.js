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
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'kpitoday',
    connectionLimit: 100,
}