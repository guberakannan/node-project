const modulesModel = require('../models/modules');
const userModel = require('../models/Users')

exports.create = (req, res) => {
    try {
        req.body.organization = req.admin.organization;
        modulesModel.create(req.body, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} })
            } else {
                res.status(200).json({ "success": true, error: {}, data: result })
            }
        });
    } catch (error) {
        res.status(500).json({ "success": false, error: error, data: {} })
    }
}

// update module route
exports.update = async (req, res) => {

    const moduleData = req.body;

    modulesModel.findOne({ _id: { $ne : moduleData._id }, title: moduleData.name, organization: req.admin.organization }, { _id: 1 }, (err, result) => {
        if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });

        if (result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module already exists. Choose another name' } });

        modulesModel.findOne({ _id: moduleData._id, organization: req.admin.organization }, { _id: 1 }, (err, result) => {
            if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
    
            if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module doesnot exists' } });
    
            modulesModel.update({ _id: result._id }, { title: moduleData.name, link: moduleData.link, content: moduleData.content, parent: moduleData.parent }, (err, result) => {
                if (err) {
                    res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } });
                } else {
                    res.json({ 'success': true, data: { "message": "User Details Updated Successfully" }, errors: {} });
                }
            });
        });

    });
    
}

exports.fetch = (req, res) => {
    try {
        modulesModel.find({ organization: req.admin.organization }, (err, result) => {
            if (err) {
                res.status(500).json({ "success": false, error: err, data: {} })
            } else {
                res.status(200).json({ "success": true, error: {}, data: result })
            }
        });

    } catch (error) {
        res.status(500).json({ "success": false, error: err, data: {} })
    }
}
// delete module route
exports.delete = async (req, res) => {
    modulesModel.findOne({ _id: req.params.module, organization : req.admin.organization }, { _id: 1 }, (err, result) => {
      if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })
  
      if (!result) return res.status(422).json({ success: false, data: {}, errors: { message: 'Module doesnot exists' } })
  
      userModel.updateMany({permittedModules: req.params.module}, { $pull: { permittedModules: req.params.module } }, (err, result) => {
        if (err) return res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })

        modulesModel.remove({_id: req.params.module}, (err, result) => {
            if(err){
              res.status(500).json({ success: false, data: {}, errors: { message: 'Internal server error' } })
            }else{
              res.json({ 'success': true, data: {"message": "User deleted successfully"}, errors: {} });
            }
          });
      });
    });
  }