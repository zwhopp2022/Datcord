It's not discord, it's datcord

SETUP:
  1. This project requires Node.js and postgres to be effectively run.
  2. command npm run setup will create necessary database and all tables
  3. To install all dependencies please run npm i
  4. Port 8080 must be open on the machine running the application.
  5. npm run start will run the server and allow you to connect to the site.

Notice: all client side js files are currently configured to send requests to the deployed url, these must be changed to the url of your choice (localhost or deployed domain) to have the app function. 

For local development, you must have a appsettings.json file in the Datcord directory with the following structure. The only value you must change is password.

{
	"user": "postgres",
	"host": "localhost",
	"database": "datcord",
	"password": "YOURPOSTGRESPASSWORDHERE",
	"port": 5432
}
