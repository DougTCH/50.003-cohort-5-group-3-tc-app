@echo off

REM Set variables
SET SFTP_SERVER=kaligo.files.com
SET USERNAME=c5g3
SET SSH_KEY_PATH=sshkeys
SET SFTP_COMMANDS_FILE=sftp_commands.txt
SET LOCAL_DIR=HandBackFiles

REM Run SFTP commands
sftp -i %SSH_KEY_PATH% %USERNAME%@%SFTP_SERVER% < %SFTP_COMMANDS_FILE%

REM Check if SFTP command was successful
IF NOT ERRORLEVEL 1 (
    echo Files uploaded successfully.

    REM Empty the local directory
    echo Deleting files in %LOCAL_DIR%
    del /q %LOCAL_DIR%\*

    echo Local directory emptied.
) ELSE (
    echo SFTP upload failed.
)
