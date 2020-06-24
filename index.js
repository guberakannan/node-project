global.express = require('express');
global.app = express();
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');

passport.use(new LocalStrategy(
    function (username, password, done) {
        if (username === "admin@gmail.com" && password === "admin") {
            return done(null, username);
        } else {
            return done("unauthorized access", false);
        }
    }
));

passport.serializeUser(function (user, done) {
    if (user) done(null, user);
});

passport.deserializeUser(function (id, done) {
    done(null, id);
});

var corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
        callback(null, true)
    }
}
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '1000mb' }));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const auth = () => {
    return (req, res, next) => {
        passport.authenticate('local', (error, user, info) => {
            if (error) res.status(400).json({ "success": false, "message": error });
            req.login(user, function (error) {
                if (error) return next(error);
                next();
            });
        })(req, res, next);
    }
}

app.use(passport.initialize());
app.use(passport.session());

// app.use(function (req, res, next) {
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.header('Access-Control-Allow-Credentials', 'true');
//     res.header("Access-Control-Allow-Origin", req.headers.origin);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    return res.status(400).json({ "statusCode": 400, "message": "not authenticated" })
}

app.post('/api/authenticate', auth() , (req, res) => {
    let returnData = {user: req.body.username}
    res.status(200).json({"success" : true ,"data" : returnData});
});


app.listen(3000, () => {
    console.log('App running at 3000')
})