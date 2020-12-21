#!/bin/bash

echo What should the version be?
read VESION
echo $VERSION

docker build -t juanspada/lirredit2:$VERSION
docker push juanspada/lirredit2:$VERSION
ssh root@.... "docker pull juanspada/lirredit2:$VERSION && docker tag juanspada/lirredit2:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"