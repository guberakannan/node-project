//Configure Mongoose
const mongoose = require('mongoose');
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
// mongoose.set('debug', true);
