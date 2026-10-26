#! /bin/bash

ssh -o BatchMode=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=2 aws << EOF
  cd personal-website-3/
  git pull
EOF
