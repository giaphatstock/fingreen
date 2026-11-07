Add-Type -AssemblyName System.Drawing

function Convert-LogoClean {
    param (
        [string]$inputPath,
        [string]$outOriginal,
        [string]$outDark
    )

    $src = [System.Drawing.Bitmap]::FromFile($inputPath)
    $w = $src.Width
    $h = $src.Height

    # 1. Tim Bounding Box
    $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $src.GetPixel($x, $y)
            if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    $pad = 6
    $minX = [Math]::Max(0, $minX - $pad)
    $minY = [Math]::Max(0, $minY - $pad)
    $maxX = [Math]::Min($w - 1, $maxX + $pad)
    $maxY = [Math]::Min($h - 1, $maxY + $pad)

    $cropW = $maxX - $minX + 1
    $cropH = $maxY - $minY + 1

    Write-Host "Crop: ($minX, $minY) - ${cropW}x${cropH}"

    $bmpOrig = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bmpDark = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $cropH; $y++) {
        for ($x = 0; $x -lt $cropW; $x++) {
            $origX = $minX + $x
            $origY = $minY + $y
            $p = $src.GetPixel($origX, $origY)

            $r = $p.R; $g = $p.G; $b = $p.B

            # Tinh do trang
            $whiteness = [Math]::Min($r, [Math]::Min($g, $b))

            if ($whiteness -ge 245) {
                # Nen trang -> Trong suot hoan toan
                $bmpOrig.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } elseif ($whiteness -ge 220) {
                # Vien chuyen tiep nhe nhang (anti-alias)
                $alpha = [int](255 * (245 - $whiteness) / 25)
                $bmpOrig.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))

                # Kiem tra mau den trung tinh
                $diffRG = [Math]::Abs($r - $g)
                $diffGB = [Math]::Abs($g - $b)
                $isNeutralDark = ($r -lt 90 -and $g -lt 90 -and $b -lt 90 -and $diffRG -lt 18 -and $diffGB -lt 18)
                if ($isNeutralDark) {
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
                } else {
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
                }
            } else {
                # Noi dung logo: Giu nguyen 100% mau goc cho Original (nen sang)
                $bmpOrig.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))

                # Cho Dark: Chi chuyen mau den trung tinh (chu FIN / Slogan) sang trang
                # Cot nen xanh la co g >> r va g >> b, nen diffRG > 25 -> KHONG bi doi mau!
                $diffRG = [Math]::Abs($r - $g)
                $diffGB = [Math]::Abs($g - $b)
                $isNeutralDark = ($r -lt 90 -and $g -lt 90 -and $b -lt 90 -and $diffRG -lt 18 -and $diffGB -lt 18)

                if ($isNeutralDark) {
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
                } else {
                    $bmpDark.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))
                }
            }
        }
    }

    $src.Dispose()
    $bmpOrig.Save($outOriginal, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpDark.Save($outDark, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpOrig.Dispose()
    $bmpDark.Dispose()

    Write-Host "Xuat thanh cong: $outOriginal va $outDark"
}

# 1. Logo Ngang
Convert-LogoClean `
    -inputPath "C:/Users/Admin/.gemini/antigravity/brain/344a4618-4464-4039-a177-41749546e375/.user_uploaded/media_1794030540003_b0a66db0.jpg" `
    -outOriginal "C:/Users/Admin/Downloads/web/fingreen/public/logo-horizontal-original.png" `
    -outDark "C:/Users/Admin/Downloads/web/fingreen/public/logo-horizontal-dark.png"

# 2. Logo Doc
Convert-LogoClean `
    -inputPath "C:/Users/Admin/.gemini/antigravity/brain/344a4618-4464-4039-a177-41749546e375/.user_uploaded/media_1794030548453_13dd0db4.jpg" `
    -outOriginal "C:/Users/Admin/Downloads/web/fingreen/public/logo-vertical-original.png" `
    -outDark "C:/Users/Admin/Downloads/web/fingreen/public/logo-vertical-dark.png"
