#!/bin/bash4
echo $PWD
declare -A reqs=()

function list() {
    for s in "$@" ; do
	echo -n "'$s', "
    done
}

for req in *.js ; do
    req=${req%.js}
    #echo "  $req:"
    reqs[$req]+=""
    for js in $(ack -l "\\b$req\\.[_a-z]") ; do
	js=${js%.js}
	if [ "$js" != "$req" ] ; then
	    reqs[$js]+=" $req"
	fi
    done
done

#typeset -p reqs
echo "\$requires = [";
for k in ${!reqs[@]} ; do
    echo "	'$k' => [" $(list ${reqs[$k]}) "],"
done
echo "];"
