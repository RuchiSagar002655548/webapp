const helper = require('../config/helper');
const db = require('../config/dbSetup');
const logger = require('../logger/loggerindex');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();
 
// Configure AWS
//AWS.config.update({ region: process.env.AWS_REGION });
//const sns = new AWS.SNS();
 
const createNewSubmission = async (req, res) => { // Create new Submission function
 
    helper.statsdClient.increment('POST_submissiondetails');
    if(!req.body.submission_url || typeof req.body.submission_url !== 'string' ||
        (typeof req.body.submission_url === 'string' && req.body.submission_url.trim() === '') ||
        !/^(http|https):\/\/.*\.zip$/.test(req.body.submission_url) || Object.keys(req.body).length > 1)
 
            logger.error({method: "POST", uri: "/v1/assignments" + req.params.id + "/submission", statusCode: 400, message: "Enter Valid URL and request body"});
            return res.status(400).set('Cache-Control', 'no-store, no-cache, must-revalidate').send();
        }
       
 
    try{
 
        //const response = await axios.head(req.body.submission_url);
       
 
        const assignmentObj = await db.assignment.findOne({where:{id:req.params.id}});
 
        // Check if the assignment exists
        if (!assignmentObj) {
            logger.error({method: "POST", uri: "/v1/assignments/" + req.params.id, statusCode: 404, message:"Assignment Not found"});
            return res.status(404).set('Cache-Control', 'no-store, no-cache, must-revalidate').send();
        }
 
        const { eMail, pass } = helper.getDecryptedCreds(req.headers.authorization);
    
 
        // Check if the deadline has not passed
        if (new Date(assignmentObj.deadline) < new Date()) {
            logger.error({method: "POST", uri: "/v1/assignments" + req.params.id + "/submission", statusCode: 400, message: "Deadline has passed"});
            return res.status(400).set('Cache-Control', 'no-store, no-cache, must-revalidate').send();
        }
 
        // Check the number of attempts
        let submissionCount = await db.submission.count({ where: { assignment_id: req.params.id } });
        if (submissionCount >= assignmentObj.num_of_attempts) {
            logger.error({method: "POST", uri: "/v1/assignments" + req.params.id + "/submission", statusCode: 400, message: "Maximum number of attempts exceeded"});
            return res.status(400).set('Cache-Control', 'no-store, no-cache, must-revalidate').send();
        }  
       
        /*
        const message = {
            submission_url: req.body.submission_url,
            email: eMail,
            user_name: user.first_name,
            user_id: user.id,
            assign_id: req.params.id,
            status: 'valid'
        };
        const params = {
            Message: JSON.stringify(message),
            TopicArn: process.env.SNS_TOPIC_ARN
        };
        await sns.publish(params).promise();*/
 
        let data = await db.submission.create({
            assignment_id: req.params.id,
            submission_url: req.body.submission_url,
            submission_date: new Date().toISOString(),
            submission_updated: new Date().toISOString()
        });
 
        let result = {
            "id": data.dataValues.id,
            "assignment_id": data.dataValues.assignment_id,
            "submission_url": data.dataValues.submission_url,
            "submission_date": data.dataValues.submission_date,
            "submission_updated": data.dataValues.submission_updated,  
        }
        logger.info({method: "POST", uri: "/v1/assignments" + req.params.id + "/submission", statusCode: 201, message: "Submission Accepted" });
        return res.status(201).set('Cache-Control', 'no-store, no-cache, must-revalidate').json(result);
    }
    catch(err) {
   
            logger.error({method: "POST", uri: "/v1/assignments" + req.params.id + "/submission", statusCode: 500, message: "Server error: " + err.message  });
            return res.status(500).set('Cache-Control', 'no-store, no-cache, must-revalidate').send();
    } 
 
module.exports = {
    createNewSubmission
}