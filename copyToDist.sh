#!/bin/bash
sleep 3
#used to copy non-ts files to the dist folder after running tsc on npm package scripts

cp -rf ./src/preload.js ./dist-js/
cp -rf ./src/View/index.html ./dist-js/View/
cp -rf ./src/View/css ./dist-js/View/
cp -rf ./src/View/pictures ./dist-js/View/
cp -rf ./src/View/js ./dist-js/View/
cp -rf ./src/View/css ./dist-js/View/
