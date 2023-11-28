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
git clone -b release-2.15 https://github.com/kubernetes-sigs/kubespray.git ${HOME}/pai-deploy/kubespray

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
python3 -m pip install paramiko==2.12.0 # need paramiko for ansible-playbook
python3 -m pip install -r script/requirements.txt

echo "Install sshpass"
sudo apt-get -y install sshpass

# test in ubuntu20.04 and ubunutu22.04
sed -i 's/python-apt/python3-apt/' ${HOME}/pai-deploy/kubespray/roles/kubernetes/preinstall/vars/ubuntu.yml
sed -i 's/aufs-tools/python3-apt/' ${HOME}/pai-deploy/kubespray/roles/kubernetes/preinstall/vars/ubuntu.yml
sed -i 's/python-minimal/python*-minimal/' ${HOME}/pai-deploy/kubespray/roles/bootstrap-os/tasks/bootstrap-debian.yml
# test in docker 24.0.7
sed -i 's/19.03/latest/' ${HOME}/pai-deploy/kubespray/roles/container-engine/docker/defaults/main.yml
sed -i 's/# docker_version/docker_version/' ${HOME}/pai-deploy/kubesprayinventory/pai/openpai.yml
sed -i 's/container_manager: containerd/container_manager: docker/' ${HOME}/pai-deploy/kubespray/roles/kubespray-defaults/defaults/main.yaml
echo "Install kubespray's requirements and ansible is included"
python3 -m pip install -r ${HOME}/pai-deploy/kubespray/requirements.txt
