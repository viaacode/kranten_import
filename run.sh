#! /bin/sh --

directory='./cegesoma/test'
pid='fn10p1180z'

rm ${directory}/*_mets.xml

# for dir in ${directory}/*; do
# 	for file in ${dir}/*; do
# 		echo mv ${file} ${file%%*/}/${pid}${file##_*}
# 	done
# done

metsfile=$(mktemp)

node main --pid=${pid} --directory=${directory} \
	| xmllint -format - \
	> ${metsfile}

cp ${metsfile} ${directory}/${pid}_mets.xml

node include-alto.js --directory=${directory} > ${metsfile}

cp ${metsfile} ${directory}/${pid}_mets.xml
rm ${metsfile}

cd ${directory}
zip -r ../${pid}.complex *
