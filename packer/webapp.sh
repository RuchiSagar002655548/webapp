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


# Create the database and user, then grant permissions
sudo mysql -u root <<EOF
CREATE USER IF NOT EXISTS '${DBUSER}'@'${DBHOST}' IDENTIFIED BY '${DBPASS}';
GRANT ALL PRIVILEGES ON . TO '${DBUSER}'@'${DBHOST}' WITH GRANT OPTION;
CREATE DATABASE IF NOT EXISTS ${DATABASE};
GRANT ALL PRIVILEGES ON ${DATABASE}.* TO '${DBUSER}'@'${DBHOST}';
FLUSH PRIVILEGES;
EOF

#sudo mysqladmin -u ${DBUSER} password ${DBPASS}
#mysqladmin -u ${DBUSER} --password=${DBPASS} --host=${DBHOST} --port=${DBPORT} create ${DATABASE}
sudo systemctl enable mariadb

# Install unzip if not installed
sudo apt-get install unzip -y

# Unzip the web application
unzip webapp.zip -d webapp
cd webapp
npm install