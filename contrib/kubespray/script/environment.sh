#!/bin/bash

while getopts "c:" opt; do
  case $opt in
    c)
      CLUSTER_CONFIG=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG"
      exit 1
      ;;
  esac
done

echo "Create working folder in ${HOME}/pai-deploy"
mkdir -p ${HOME}/pai-deploy/

echo "Clone kubespray source code from github to ${HOME}/pai-deploy"
sudo rm -rf ${HOME}/pai-deploy/kubespray
git clone -b release-2.15 https://gitee.com/xana/kubespray.git ${HOME}/pai-deploy/kubespray

echo "Copy inventory folder, and save it "
cp -rfp ${HOME}/pai-deploy/kubespray/inventory/sample ${HOME}/pai-deploy/kubespray/inventory/pai


echo "Install necessray packages"

echo "Install Python3 and pip"
sudo apt-get -y update
sudo apt-get -y install software-properties-common python3 python3-dev python3-pip
# "apt-get install python3" will install python3.5 on Ubuntu 16.04
# The lastest pip doesn't support python3.5.
# Here we use a fixed version number to ensure compatibility.
python3 -m pip install pip==20.3.4

echo "Install python packages"
python3 -m pip install paramiko # need paramiko for ansible-playbook
python3 -m pip install -r script/requirements.txt

echo "Install sshpass"
sudo apt-get -y install sshpass

# ansible 2.7 doesn't support distribution info collection on Ubuntu 20.04
# Use ansible 2.9.7 as a workaround
# Reference: https://stackoverflow.com/questions/61460151/ansible-not-reporting-distribution-info-on-ubuntu-20-04
# We can upgrade kubespray version to avoid this issue in the future.
sed -i 's/ansible==.*/ansible==6.4.0/' ${HOME}/pai-deploy/kubespray/requirements.txt
sed -i 's/jinja2==.*/jinja2/' ${HOME}/pai-deploy/kubespray/requirements.txt
sed -i 's/cryptography==.*/cryptography/' ${HOME}/pai-deploy/kubespray/requirements.txt
sed -i 's/minimal_ansible_version: .*/minimal_ansible_version: 1.0.0/' ${HOME}/pai-deploy/kubespray/ansible_version.yml
sed -i 's/maximal_ansible_version: .*/maximal_ansible_version: 9.15.0/' ${HOME}/pai-deploy/kubespray/ansible_version.yml

echo "Install kubespray's requirements and ansible is included"
python3 -m pip install -r ${HOME}/pai-deploy/kubespray/requirements.txt
