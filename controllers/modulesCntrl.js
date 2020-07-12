const modulesModel = require('../models/modules');

exports.create = (req, res) =>{
    try{
        modulesModel.create(req.body, (err, result) => {
            if(err){
                res.status(500).json({"success": false, error: err, data: {}})
            }else{
                res.status(200).json({"success": true, error: {}, data: result})
            }
        });

    }catch(error){
        res.status(500).json({"success": false, error: err, data: {}})
    }
}

exports.fetch = (req, res) =>{
    try{
        modulesModel.find(req.body, (err, result) => {
            if(err){
                res.status(500).json({"success": false, error: err, data: {}})
            }else{
                res.status(200).json({"success": true, error: {}, data: result})
            }
        });

    }catch(error){

    }
}