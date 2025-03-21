A lambda handler project that uses typescript with nest js to process incoming payloads in s3 bucket, downloads ISD information from a link attached to the payload and stores it into a Postgress Sql database

An example of a payload can be found in input.json. You can see "distributionDeliveryURI" field that holds a link to download a zip file containing ISD data. This zip will be then parsed and each csv entry will be saved as a separate table into a postgress database.

You will need a locally running postgress database
In the .env file define the connection properties to the database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_local_password
DB_NAME=emgr2104
DB_LOGGING=false

Make sure you are using an aws profle because altough we are using localstack, it needs an access_key and secret_key to exist

To run the project:

1. run 'npm run build'
2. run 'serverless offline'

This will start an instance of localstack with a bucket called 'test-bucket'
This will also deploy the lambda function on this local aws environment

3. on another terminal run 'aws s3 cp input.json s3://test-bucket/ --endpoint-url=http://localhost:4569'
   This ill upload the contents of input.json to the s3 bucket and trigger the entire flow. You can then check the postgress database to see the tables created
