@echo off

REM Set variables
SET SFTP_SERVER=kaligo.files.com
SET USERNAME=c5g3
SET SSH_KEY_PATH=sshkeys
SET SFTP_COMMANDS_FILE=sftp_commands.txt

REM Run SFTP commands
sftp -i %SSH_KEY_PATH% %USERNAME%@%SFTP_SERVER% < %SFTP_COMMANDS_FILE%

echo Files uploaded successfully.
pause
