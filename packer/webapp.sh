#!/bin/bash

# Update the system
sudo apt update -y
sudo apt upgrade -y

# Export database credentials and other env variables
export DBHOST="127.0.0.1"
export DBUSER="root"
export DBPASS="Root123#"
export DATABASE="assign3_db"
export PORT=3000
export DBPORT=3306

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MariaDB
sudo apt-get install -y mariadb-server
sudo systemctl start mariadb


# Log in as superuser
sudo mysql -u root <<EOF
-- Change the authentication method to mysql_native_password
ALTER USER '$DBUSER'@'$DBHOST' IDENTIFIED WITH 'mysql_native_password' BY '$DBPASS';
FLUSH PRIVILEGES;

-- Create the database and user
CREATE DATABASE IF NOT EXISTS $DATABASE;
GRANT ALL PRIVILEGES ON $DATABASE.* TO '$DBUSER'@'$DBHOST' IDENTIFIED BY '$DBPASS' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF
echo "MySQL setup completed. Database '$DATABASE' and user '$DBUSER' on host '$DBHOST' have been created.
#sudo mysqladmin -u ${DBUSER} password ${DBPASS}
#mysqladmin -u ${DBUSER} --password=${DBPASS} --host=${DBHOST} --port=${DBPORT} create ${DATABASE}
sudo systemctl enable mariadb

# Install unzip if not installed
sudo apt-get install unzip -y

# Unzip the web application
unzip webapp.zip -d webapp
cd webapp
npm install