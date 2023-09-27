#!/bin/bash

# Get the directory of the script
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Command to run the first script in a new terminal window
osascript -e "tell application \"Terminal\" to do script \"cd '$script_dir'; node alice.js\""

# Command to run the second script in a new terminal window
osascript -e "tell application \"Terminal\" to do script \"cd '$script_dir'; node bob.js\""
