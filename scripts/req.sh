#!/bin/bash4
# keep an eye on ignore for editor,udfs
declare -A reqs=() ignore=([version,dsa]=1 [editor,udfs]=1)
declare -a keys

function list() {
    for s in "$@" ; do
	echo -n "'$s', "
    done
}
echo "$0"
self=$(basename $0)
path=$(dirname $0)
dir=$(basename "$path")
echo "// generated by ${dir}/${self}"

cd "$path"

for req in $(ls *.js | sort --ignore-case) ; do
    req=${req%.js}
    #echo "  $req:"
    keys+=($req)
    reqs[$req]+=""
    # TODO:
    # * filter out matches in comments
    # * allow for optionally required modules ('@includes'?)
    for js in $(ack -il "^[^a-z]*requires? $req$|@requires? .*\\b$req\\b|[^.]\\b$req\\.[_a-z]|new $req|mixIn\\(\\w+, $req\\)") ; do
	js=${js%.js}
	#if [ "$js" != "$req" -a ! "${ignore[$js,$req]}" ] ; then
	if [[ "$js" != "$req" && ! "${ignore[$js,$req]}" ]] ; then
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
