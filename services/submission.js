const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();
 
// Initialize AWS clients
const sns = new AWS.SNS();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ region: process.env.REGION });
 
exports.handler = async (event) => {
    const gcpServiceAccountKey = JSON.parse(process.env.GOOGLE_CREDENTIALS);
   
    // Parse SNS message
    const message = JSON.parse(event.Records[0].Sns.Message);
    const submissionUrl = message.submission_url;
    const email = message.email;
    const user_name = message.user_name;
    const user_id = message.user_id;
    const assign_id = message.assign_id;
 
    if (message.status === 'invalid_url') {
        // Handle invalid submission URL scenario
        await sendEmail(email, 'Download Failed and Invalid submission', 'The submission URL was invalid. Kindly try to submit again with correct URL.', process.env.MAILGUN_API_KEY, process.env.MAILGUN_DOMAIN);
        await logStatusToDynamoDB(uuidv4(), email, submissionUrl, 'Download Failed', dynamoDB, process.env.DYNAMODB_TABLE);
        return { statusCode: 200, body: JSON.stringify('Invalid submission handled') };
    }
 
    if (message.status === 'no_file') {
        // Handle invalid submission URL scenario
        await sendEmail(email, 'Download Failed and Invalid submission', 'The submission URL is invalid and file does not exist. Kindly confirm it again.', process.env.MAILGUN_API_KEY, process.env.MAILGUN_DOMAIN);
        await logStatusToDynamoDB(uuidv4(), email, submissionUrl, 'Download Failed', dynamoDB, process.env.DYNAMODB_TABLE);
        return { statusCode: 200, body: JSON.stringify('Invalid submission handled') };
    }
 
    try {
        // Attempt to download the file from GitHub
        const response = await axios.get(submissionUrl);
        const fileContent = response.data;
 
        // Generate a unique filename
        const unique_id = uuidv4();
        const timestamp = new Date().getTime();
        const date = new Date(timestamp);
        const time = date.toString();
        const filename = `${user_name}_${user_id}/${assign_id}/${time}_${unique_id}_${submissionUrl.split("/").pop()}`;
 
        // Store in Google Cloud Storage
        const storage = new Storage({ credentials: gcpServiceAccountKey });
        const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
        await bucket.file(filename).save(fileContent);
 
        // Email user about the successful download
        await sendEmail(email, 'Download Successful', 'Your file has been downloaded and stored successfully here is the link' - filename, process.env.MAILGUN_API_KEY, process.env.MAILGUN_DOMAIN);
 
        // Log success in DynamoDB
        await logStatusToDynamoDB(unique_id, email, submissionUrl, 'Download Successful', dynamoDB, process.env.DYNAMODB_TABLE);
 
        return { statusCode: 200, body: JSON.stringify('Process completed successfully') };
    } catch (error) {
        console.error('Error:', error);
 
        // Email user about the failure
        await sendEmail(email, 'Download Failed', 'There was an error downloading your file.', process.env.MAILGUN_API_KEY, process.env.MAILGUN_DOMAIN);
 
        // Log failure in DynamoDB
        await logStatusToDynamoDB(uuidv4(), email, submissionUrl, 'Download Failed', dynamoDB, process.env.DYNAMODB_TABLE);
 
        return { statusCode: 500, body: JSON.stringify('Error processing your request') };
    }
};
 
async function sendEmail(to, subject, text, apiKey, domain) {
    const mailgunUrl = `https://api.mailgun.net/v3/${domain}/messages`;
    await axios.post(mailgunUrl, new URLSearchParams({
        from: 'info@deepakcsye6225.me',
        to: to,
        subject: subject,
        text: text
    }), {
        auth: { username: 'api', password: apiKey }
    });
}
 
async function logStatusToDynamoDB(id, email, url, status, dynamoDB, tableName) {
    await dynamoDB.put({
        TableName: tableName,
        Item: { id, Email: email, SubmissionURL: url, Status: status }
    }).promise();
}