$Path = "$($args[0])"
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$Screen = [System.Windows.Forms.Screen]::PrimaryScreen
$Top = $Screen.Bounds.Top
$Left = $Screen.Bounds.Left
$Width = $Screen.Bounds.Width
$Height = $Screen.Bounds.Height
$Bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
$Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
$Graphics.CopyFromScreen($Left, $Top, 0, 0, $Bitmap.Size)
$Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$Graphics.Dispose()
$Bitmap.Dispose()
