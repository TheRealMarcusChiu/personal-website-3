#! /bin/bash

hugo


##############
# 0. GIT WAY #
##############

cd public
git add .
git commit -am "initial commit"
git push

ssh aws << EOF
  cd personal-website-two/public/
  git pull
EOF


##################
# 1. REGULAR WAY #
##################

#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  rm -rf personal-website-two/
#  mkdir personal-website-two
#EOF
#
#scp -i ~/.ssh/keys/aws-marcuschiu.pem -r ./public ec2-user@www.marcuschiu.com:~/personal-website-two


#####################
# 2. COMPRESSED WAY #
#####################

#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  rm -rf personal-website-two/
#  mkdir personal-website-two
#EOF
#
#tar czf public.tar.gz public
#scp -i ~/.ssh/keys/aws-marcuschiu.pem -r ./public.tar.gz ec2-user@www.marcuschiu.com:~/personal-website-two
#ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
#  cd personal-website-two
#  tar -xvzf public.tar.gz
#  rm public.tar.gz
#EOF
