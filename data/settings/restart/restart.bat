@ECHO OFF

cd c:\xampp\htdocs\techfooddy\server\
pm2 stop all
pm2 start app.js

exit

