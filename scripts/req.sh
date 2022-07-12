#!/bin/bash4
echo $PWD
declare -A reqs=()
declare -a keys

function list() {
    for s in "$@" ; do
	echo -n "'$s', "
    done
}

for req in *.js ; do
    req=${req%.js}
    #echo "  $req:"
    keys+=($req)
    reqs[$req]+=""
    # TODO:
    # * filter out matches in comments
    # * pick up calls to `resettableGenerator(...)`
    for js in $(ack -il "\\b$req\\.[_a-z]|new $req|mixIn\\(\\w+, $req\\)") ; do
	js=${js%.js}
	if [ "$js" != "$req" ] ; then
	    reqs[$js]+=" $req"
	fi
    done
done

#typeset -p reqs
echo "\$requires = [";
for k in ${keys[@]} ; do
    echo "	'$k' => [" $(list ${reqs[$k]}) "],"
done
echo "];"
