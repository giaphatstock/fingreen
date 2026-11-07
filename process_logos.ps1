Add-Type -AssemblyName System.Drawing

function Process-Logo {
    param (
        [string]$inputPath,
        [string]$outputDarkPath,
        [string]$outputLightPath
    )

    $src = [System.Drawing.Bitmap]::FromFile($inputPath)
    $w = $src.Width
    $h = $src.Height

    # 1. Tim bounding box
    $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $src.GetPixel($x, $y)
            # Neu khong phai trang
            if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    # Them padding nhe
    $pad = 6
    $minX = [Math]::Max(0, $minX - $pad)
    $minY = [Math]::Max(0, $minY - $pad)
    $maxX = [Math]::Min($w - 1, $maxX + $pad)
    $maxY = [Math]::Min($h - 1, $maxY + $pad)

    $cropW = $maxX - $minX + 1
    $cropH = $maxY - $minY + 1

    Write-Host "Crop region: ($minX, $minY) - ${cropW}x${cropH}"

    # Bitmap cho Light
    $bmpLight = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    # Bitmap cho Dark
    $bmpDark = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $cropH; $y++) {
        for ($x = 0; $x -lt $cropW; $x++) {
            $origX = $minX + $x
            $origY = $minY + $y
            $p = $src.GetPixel($origX, $origY)

            # Do sang (brightness)
            $r = $p.R; $g = $p.G; $b = $p.B

            # Tinh toan do trong suot: cang gan trang (255) cang trong suot
            $whiteness = [Math]::Min($r, [Math]::Min($g, $b))
            
            if ($whiteness -ge 248) {
                # Hoan toan trong suot
                $bmpLight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
                $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
            } elseif ($whiteness -ge 225) {
                # Viền chuyển tiếp mượt mà (anti-aliasing)
                $alpha = [int](255 * (248 - $whiteness) / 23)
                $bmpLight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
                
                # Dark: neu pixel mau den/xam (chu FIN/slogan) -> chuyen thanh trang
                if ($r -lt 80 -and $g -lt 80 -and $b -lt 80) {
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
                } else {
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
                }
            } else {
                # Pixel noi dung
                $bmpLight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))

                # Dark: neu pixel mau den/xam (chu FIN / slogan "Kien tao gia tri thuc")
                # Chu FIN va slogan co dac diem r, g, b deu thap (< 90) va khong co sac vang/xanh
                $isDarkText = ($r -lt 95 -and $g -lt 95 -and $b -lt 95)
                if ($isDarkText) {
                    # Bien thanh mau trang sang tinh khiet
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 250, 250, 255))
                } else {
                    # Giu nguyen bieu tuong nen vang / nen xanh va chu GREEN
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))
                }
            }
        }
    }

    $src.Dispose()
    $bmpLight.Save($outputLightPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpDark.Save($outputDarkPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpLight.Dispose()
    $bmpDark.Dispose()

    Write-Host "Done: $outputDarkPath & $outputLightPath"
}

# 1. Xu ly logo ngang
Process-Logo `
    -inputPath "C:/Users/Admin/.gemini/antigravity/brain/344a4618-4464-4039-a177-41749546e375/.user_uploaded/media_1794030540003_b0a66db0.jpg" `
    -outputDarkPath "C:/Users/Admin/Downloads/web/fingreen/public/logo-horizontal-dark.png" `
    -outputLightPath "C:/Users/Admin/Downloads/web/fingreen/public/logo-horizontal-light.png"

# 2. Xu ly logo doc
Process-Logo `
    -inputPath "C:/Users/Admin/.gemini/antigravity/brain/344a4618-4464-4039-a177-41749546e375/.user_uploaded/media_1794030548453_13dd0db4.jpg" `
    -outputDarkPath "C:/Users/Admin/Downloads/web/fingreen/public/logo-vertical-dark.png" `
    -outputLightPath "C:/Users/Admin/Downloads/web/fingreen/public/logo-vertical-light.png"
