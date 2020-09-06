const router = require('express').Router();
const organizationsCntrl = require('../../../controllers/organizationsCntrl')
const superAdminAuth = require('../../superAdminAuth');
const organizationModel = require('../../../models/organizations');

var multer = require('multer')
var validatorCreate = function (req, res, next) {
    organizationModel.isValid({ name: req.headers.name }).then(found => {
        if (found) {
            return res.status(422).json({ "success": false, errors: { message: "Organization name already exists" }, data: {} })
        }
        next();
    });
}

var validatorUpdate = function (req, res, next) {
    organizationModel.isValid({ name: req.headers.name, _id: {$ne : req.headers.id} }).then(found => {
        if (found) {
            return res.status(422).json({ "success": false, errors: { message: "Organization name already exists" }, data: {} })
        }
        next();
    });
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/organizations')
    },
    filename: function (req, file, cb) {
        let fileExt = file.originalname.split('.')[file.originalname.split('.').length - 1].toLowerCase()
        if (['png', 'jpeg', 'jpg'].indexOf(fileExt) === -1) {
            return cb(new Error('Wrong extension type'));
        }
      cb(null, Date.now() + file.originalname)
    }
  })

var upload = multer({ storage: storage });

router.post('/', superAdminAuth.required, validatorCreate, upload.single('file'), organizationsCntrl.validate('create'), organizationsCntrl.create);
router.put('/', superAdminAuth.required, validatorUpdate, upload.single('file'), organizationsCntrl.update);
router.get('/', superAdminAuth.required, organizationsCntrl.fetch);
router.delete('/:identifier', superAdminAuth.required, organizationsCntrl.validate('delete'), organizationsCntrl.delete);

module.exports = router;