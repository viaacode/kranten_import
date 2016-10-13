#! /bin/sh --

kill $(ps aux | grep -i 'node' | grep -v 'grep' | awk '{ print $2; }')
