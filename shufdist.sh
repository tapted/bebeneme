#!/bin/bash
sed -e 's/./&\n/g' MALE_dist.txt | shuf | xargs echo -e | sed -e 's/ //g'
