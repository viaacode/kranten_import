#! /bin/sh --

base=$(cd $(dirname $0) && pwd)
original=${base}'/original'
target=${base}'/target'
result=${target}/result

pid='fn10p1180z'

find ${target}/ -delete
# tar -xf ${original}/cegesoma.tar.gz -C ${target}
# cp -r ${target}/cegesoma/ARA_G00750/ARA_G00750_1916-06_01_003 ${result}
cp -r ${original}/test ${result}

chmod -R a+r ${result}

for file in $(find ${result}/ -type f); do
	name=${file##*/};
	ext=${name##*.};
	basename=${name%%.*}
	basename=${basename%_${ext}}
	basename=${basename%_alto}
	number=${basename##*[-_]}

	case "${ext}" in
		'tif' | 'tiff' ) mv ${file} ${result}/tif/${pid}_${number}_tif.tif ;;
		'xml' )
			[[ ${file} =~ "alto" ]] && mv ${file} ${result}/alto/${pid}_${number}_alto.xml ;
			[[ ${file} =~ "mets" ]] && mv ${file} ${result}/${pid}_mets.xml ;
		;;
		'jp2' ) mv ${file} ${result}/jp2/${pid}_${number}_jp2.jp2 ;;
	esac
done

for dir in $(find ${result}/ -depth 1 -type d); do
	case "${dir##*/}" in
		"result" ) ;;
		"alto" ) ;;
		"jp2" ) ;;
		"tif" ) ;;
		* ) rm -r ${dir};;
	esac
done

find ${result}/ -depth 1 -type f -delete

metsfile=$(mktemp)

node main --pid=${pid} --directory=${result} \
	| xmllint -format - \
	> ${metsfile}

cp ${metsfile} ${result}/${pid}_mets.xml

node include-alto.js --directory=${result} > ${metsfile}

cp ${metsfile} ${result}/${pid}_mets.xml
rm ${metsfile}

cd ${result}
zip -r ../${pid}.complex *
