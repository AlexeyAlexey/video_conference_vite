#!/bin/bash

# chmod +x ./switch_to_release.sh
# ./switch_to_release.sh remote_user remote_host release

ssh "$1@$2" "ln -sf /home/video_conference_vite/$3/app /home/video_conference_vite"
