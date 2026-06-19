#!/bin/bash

# chmod +x ./gen_release.sh
# ./gen_release.sh local_machine_release_dir remote_server_release_dir

echo "Started"

rel_name="$(date +"%Y%m%d_%H%M%S")"

rel_dir_path="$1/$rel_name"

echo "destination: $rel_dir_path"

mkdir -p $rel_dir_path

(cd .. && npm run build)

cp -r ../dist "$rel_dir_path/app"

cd "$rel_dir_path"

tar -czvf "app.tar.gz" "./app"

echo "tar -czvf app.tar.gz /app"

echo "release was created: $rel_name"

echo "Finished"