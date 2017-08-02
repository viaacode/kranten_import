#! /bin/sh --

kill $(ps aux | grep -i 'node' | grep 'listen' | grep -v 'grep' | awk '{ print $2; }')
