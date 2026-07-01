#! /bin/bash

ssh aws << EOF
  cd personal-website-3/
  git pull
EOF
