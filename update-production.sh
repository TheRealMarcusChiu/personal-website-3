#! /bin/bash

ssh aws << EOF
  cd personal-website-3/public/
  git pull
EOF

