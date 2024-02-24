#!/bin/bash

rm -f extension-chrome.zip
rm -f extension-firefox.zip

# # Prepare and zip the Chrome extension
zip -r extension-chrome.zip chrome-extension

# Backup the original manifest.json
cp chrome-extension/manifest.json tmp_manifest_backup.json

# Prepare and zip the Firefox extension
jq 'del(.externally_connectable) | .background |= {scripts: ["background.js"]} | .name |= "Fatebook for Firefox"' chrome-extension/manifest.json > chrome-extension/manifest_temp.json && mv chrome-extension/manifest_temp.json chrome-extension/manifest.json
cd chrome-extension && zip -r ../extension-firefox.zip * && cd ..

# Restore the original manifest.json to clean up
mv tmp_manifest_backup.json chrome-extension/manifest.json

echo "Chrome and Firefox extensions zipped successfully."