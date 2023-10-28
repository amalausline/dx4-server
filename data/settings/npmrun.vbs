Set oShell = CreateObject ("Wscript.Shell") 
Dim strArgs
strArgs = "cmd /c npmrun.bat"
oShell.Run strArgs, 0, false