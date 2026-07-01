#! /bin/bash

ssh aws << EOF
  cd personal-website-3/
  git pull
EOF

ssh my-websites << EOF
  cd /root/personal-website-3
  git pull --rebase
  systemctl restart home-admin.service
EOF
