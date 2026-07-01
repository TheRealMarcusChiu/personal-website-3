#! /bin/bash

# resolve this script's own directory so the call works from anywhere
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# pull latest onto the aws production box
"$DIR/update-production.sh"

# pull + restart the admin backend on the proxmox box
ssh my-websites << EOF
  cd /root/personal-website-3
  git pull --rebase
  systemctl restart home-admin.service
EOF
