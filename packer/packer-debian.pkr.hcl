packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-06db4d78cb1d3bbf9" //Debian 12
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "vpc_id" {
  type    = string
  default = "vpc-0ca396ea7587b4eb9"
}

variable "subnet_id" {
  type    = string
  default = "subnet-01a18584dff41ba6e"
}

variable "ami_users" {
  type    = list(string)
  default = ["677293713674"]
}

variable "artifacts_source" {
  type    = string
  default = "../webapp.zip"
}

variable "artifacts_destination" {
  type    = string
  default = "/home/admin/webapp.zip"
}

variable "script_file" {
  type    = string
  default = "webapp.sh"
}

source "amazon-ebs" "my-ami" {
  region          = "${var.aws_region}"
  ami_name        = "my-debian-ami"
  ami_description = "CSYE6225_ASSIGN5_AMI "
  ami_users       = "${var.ami_users}"
  ami_regions = [
    "us-east-1",
  ]

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }


  instance_type = "t2.micro"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"
  vpc_id        = "${var.vpc_id}"
  profile       = "dev"

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file" {
    source      = "${var.artifacts_source}"
    destination = "${var.artifacts_destination}"
  }

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1"
    ]
    script = "${var.script_file}"
  }
}6