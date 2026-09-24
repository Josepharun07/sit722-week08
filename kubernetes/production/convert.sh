#!/bin/bash

# Loop through all .yaml and .yml files in the current folder
for file in *.yaml *.yml; do
    # Skip if no matching files exist
    [ -e "$file" ] || continue
    
    # Strip the existing extension and add .txt (e.g., config.yaml -> config.txt)
    # If you prefer keeping the full name like config.yaml.txt, 
    # change "${file%.*}.txt" to "${file}.txt"
    output_file="${file%.*}.txt"
    
    cp "$file" "$output_file"
    echo "Copied $file to $output_file"
done

echo "Done!"
