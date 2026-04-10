how to say in bash / zsh 
if "out.py" exists then
    cat out.py | python replace.py "✣" "${target}" >"${target}.py"
    python ${target}.py
else
    exit 1
fi
