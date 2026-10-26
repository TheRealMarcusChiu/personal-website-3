#! /bin/bash

# pull + restart the admin backend on the proxmox box
ssh my-websites << EOF
  cd /root/personal-website-3
  git pull --rebase
  systemctl restart home-admin.service
EOF
