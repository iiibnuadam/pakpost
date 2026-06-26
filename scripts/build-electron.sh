#!/bin/bash

# Remove out directory
rm -rf packages/bruno-electron/out

# Remove web directory
rm -rf packages/bruno-electron/web

# Create a new web directory
mkdir packages/bruno-electron/web

# Copy build
cp -r packages/bruno-app/dist/* packages/bruno-electron/web


# Update static paths
sed -i'' -e 's@/static/@static/@g' packages/bruno-electron/web/**.html
sed -i'' -e 's@/static/font@../../static/font@g' packages/bruno-electron/web/static/css/**.**.css

# Remove sourcemaps
find packages/bruno-electron/web -name '*.map' -type f -delete

build_dist() {
  if [ "$1" == "snap" ]; then
    echo "Building snap distribution"
    npm run dist:snap --workspace=packages/bruno-electron
  elif [ "$1" == "mac" ]; then
    echo "Building mac distribution"
    npm run dist:mac --workspace=packages/bruno-electron
  elif [ "$1" == "win" ]; then
    echo "Building windows distribution"
    npm run dist:win --workspace=packages/bruno-electron
  elif [ "$1" == "deb" ]; then
    echo "Building debian distribution"
    npm run dist:deb --workspace=packages/bruno-electron
  elif [ "$1" == "rpm" ]; then
    echo "Building rpm distribution"
    npm run dist:rpm --workspace=packages/bruno-electron
  elif [ "$1" == "linux" ]; then
    echo "Building linux distribution"
    npm run dist:linux --workspace=packages/bruno-electron
  else
    echo "Unknown build distribution type: $1"
  fi
}

if [ $# -eq 0 ]; then
  echo "Please pass at least one build distribution type"
  exit 1
fi

for dist in "$@"; do
  build_dist "$dist"
done