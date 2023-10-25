#!/bin/bash
set -e  # This will cause the script to exit if any command returns a non-zero exit code

# Update the system
sudo apt update -y
sudo apt upgrade -y


# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs


# Install unzip if not installed
sudo apt-get install unzip -y

# This will unzip the web application
unzip webapp.zip -d webapp
cd webapp
npm install

echo "Setting up and starting the webapp service"
sudo cp /home/admin/webapp/packer/webapp.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable webapp
sudo systemctl start webapp
sudo systemctl restart webapp
 
echo "Script executed successfully!"