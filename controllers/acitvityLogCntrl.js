const mongoose = require('mongoose');
const activitylogsModel = require('../models/activityLogs');
const _ = require('lodash')
const async = require('async');

// Get activity logs
exports.fetch = (req, res) => {

    let condition = [{
            $match: {
                organization: new mongoose.Types.ObjectId(req.admin.organization)
            }
        },
        {
            $project: {
                _id: 0,
                updatedAt: 0
            }
        }
    ]
    activitylogsModel.aggregate(condition, (err, logs) => {
        if (!err) {
            res.json({
                'success': true,
                data: logs,
                errors: {}
            });
        } else {
            res.status(500).json({
                success: false,
                data: {},
                errors: {
                    message: err
                }
            });
        }
    });
};