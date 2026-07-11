#!/bin/bash
# Test routes for basic functionality.
# This script requires that nodejs be installed as 'node'
INITIAL='{"<3,1>":0,"<3,2>":39}'
UPDATED='{"<3,1>":0,"<13,1>":39}'
COMBINED='{"<3,1>":0,"<3,2>":39,"<13,1>":39}'

code=$(curl -o /dev/null -I -w "%{http_code}" -s \
	    http://localhost:3000/api/map/arbitrary)
SERVER=none
if [[ $code == "000" ]]
then
    echo Starting development server ...
    npm run dev &
    SERVER=$!
    sleep 5
fi

json=$(curl -Ss -X POST http://localhost:3000/api/map \
	    -H 'Content-Type: application/json' \
	    -d $INITIAL)
if [[ $json == "" ]]
then
    echo "POST failed"
else
    id=$(node -p "($json).id")
    if [[ $id == "" ]]
    then
	echo "POST didn't work: $json"
    else
	editKey=$(node -p "($json).editKey")
	echo Posted Terrain Map to $id with edit key $editKey
	if [[ ! -f data/$id.json ]]
	then
	    echo "JSON file for $id not created in data/"
	else
	    if [[ ! -f data/$id.key ]]
	    then
		echo "Key file for $id not created in data/"
	    else
		fileJSON=$(cat data/$id.json)
		fileKey=$(cat data/$id.key)

		if [[ "true" != $(node -p "JSON.stringify($INITIAL) === JSON.stringify($fileJSON)") ]]
		then
		    echo File JSON does not match: "$fileJSON"
		fi
		if [[ $editKey != $fileKey ]]
		then
		    echo File Key does not match: "$fileKey"
		fi

		json=$(curl -Ss -X GET http://localhost:3000/api/map/$id)

		echo Read $json when using GET
		if [[ "true" != $(node -p "JSON.stringify($INITIAL) === JSON.stringify($json)")  ]]
		then
		    echo GET JSON does not match: "$json"
		fi

		code=$(curl -s -o /dev/null -w "%{http_code}" \
			    -X PATCH http://localhost:3000/api/map/$id \
			    -d "{}" \
			    -H "Authorization: Bearer $editKey")
		if [[ $code != "200" ]]
		then
		    echo NOP PATCH did not succeed.  Response code: "$code"
		fi
		if [[ -f data/${id}.json ]]
		then
			fileJSON=$(cat data/$id.json)
			if [[ "true" != $(node -p "JSON.stringify($INITIAL) === JSON.stringify($fileJSON)")  ]]
			then
				echo NOP PATCH changed JSON: "$fileJSON"
			fi
		else
		    echo NOP PATCH deleted JSON "file?"
		fi

		code=$(curl -s -o /dev/null -w "%{http_code}" \
			    -X PATCH http://localhost:3000/api/map/$id \
			    -d "$UPDATED" \
			    -H "Authorization: Bearer $editKey")
		if [[ $code != "200" ]]
		then
		    echo PATCH did not succeed.  Response code: "$code"
		fi
		if [[ -f data/${id}.json ]]
		then
		    fileJSON=$(cat data/$id.json)
		    if [[ "true" != $(node -p "JSON.stringify($COMBINED) === JSON.stringify($fileJSON)") ]]
		    then
			echo File JSON does not match after PATCH: "$fileJSON"
		    fi
		else
		    echo PATCH deleted JSON "file?"
		fi

		code=$(curl -s -o /dev/null -w "%{http_code}" \
			    -X PUT http://localhost:3000/api/map/$id \
			    -d "$UPDATED" \
			    -H "Authorization: Bearer $editKey")
		if [[ $code != "200" ]]
		then
		    echo PUT did not succeed.  Response code: "$code"
		fi
		if [[ -f data/${id}.json ]]
		then
		    fileJSON=$(cat data/$id.json)
		    if [[ "true" != $(node -p "JSON.stringify($UPDATED) === JSON.stringify($fileJSON)") ]]
		    then
			echo File JSON does not match after PUT: "$fileJSON"
		    fi
		else
		    echo PUT deleted JSON "file?"
		fi
		
		code=$(curl -s -o /dev/null -w "%{http_code}" \
			    -X DELETE http://localhost:3000/api/map/$id \
			    -H "Authorization: Bearer $editKey")
		if [[ $code != "200" ]]
		then
		    echo DELETE did not work. Response code: "$code"
		fi
		if [[ -f data/${id}.json ]]
		then
		    echo DELETE did not remove data file: data/$id.json
		fi
		if [[ -f data/${id}.key ]]
		then
		    echo DELETE did not remove key file: data/$id.key
		fi
		
	    fi
	fi
    fi
fi

if [[ $SERVER != "none" ]]
then
	echo Stopping script-started development server
	if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]
	then
		taskkill.exe //F //PID $SERVER //T
		taskkill.exe //F //IM node.exe
	else
		kill $SERVER
		killall 'next-server (v16.1.6)'
	fi
fi
