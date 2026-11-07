Add-Type -AssemblyName System.Drawing

# 1. Trich xuat rieng bieu tuong do thi chu G cho favicon
$src = [System.Drawing.Bitmap]::FromFile("C:/Users/Admin/.gemini/antigravity/brain/344a4618-4464-4039-a177-41749546e375/.user_uploaded/media_1794030548453_13dd0db4.jpg")
$w = $src.Width
$h = $src.Height

# Bieu tuong chu G nam o nua tren cua anh (y tu 250 den 600, x tu 360 den 640)
# Tim bounding box cua bieu tuong chu G (loai bo phan chu FINGREEN o duoi)
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0

# Chu FINGREEN bat dau tu khoang y = 620 tro di, nen ta chi quet y tu 200 den 610
for ($y = 200; $y -lt 615; $y++) {
    for ($x = 250; $x -lt 750; $x++) {
        $p = $src.GetPixel($x, $y)
        if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$pad = 10
$minX = [Math]::Max(0, $minX - $pad)
$minY = [Math]::Max(0, $minY - $pad)
$maxX = [Math]::Min($w - 1, $maxX + $pad)
$maxY = [Math]::Min($h - 1, $maxY + $pad)

$iconW = $maxX - $minX + 1
$iconH = $maxY - $minY + 1

Write-Host "Icon Bounding Box: ($minX, $minY) - ${iconW}x${iconH}"

$bmpIcon = New-Object System.Drawing.Bitmap $iconW, $iconH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $iconH; $y++) {
    for ($x = 0; $x -lt $iconW; $x++) {
        $origX = $minX + $x
        $origY = $minY + $y
        $p = $src.GetPixel($origX, $origY)

        $r = $p.R; $g = $p.G; $b = $p.B
        $whiteness = [Math]::Min($r, [Math]::Min($g, $b))

        if ($whiteness -ge 245) {
            $bmpIcon.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($whiteness -ge 220) {
            $alpha = [int](255 * (245 - $whiteness) / 25)
            $bmpIcon.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
        } else {
            $bmpIcon.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))
        }
    }
}

$src.Dispose()

# Resize ve hinh vuong chat luong cao 128x128 cho Favicon
$favSize = 128
$favBmp = New-Object System.Drawing.Bitmap $favSize, $favSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($favBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Can giua
$scale = [Math]::Min(($favSize - 8) / $iconW, ($favSize - 8) / $iconH)
$destW = [int]($iconW * $scale)
$destH = [int]($iconH * $scale)
$destX = [int](($favSize - $destW) / 2)
$destY = [int](($favSize - $destH) / 2)

$g.DrawImage($bmpIcon, $destX, $destY, $destW, $destH)
$g.Dispose()
$bmpIcon.Dispose()

# Luu thanh favicon.png va favicon.ico
$favBmp.Save("C:/Users/Admin/Downloads/web/fingreen/public/favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("C:/Users/Admin/Downloads/web/fingreen/public/favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("C:/Users/Admin/Downloads/web/fingreen/public/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Dispose()

Write-Host "Tao Favicon thanh cong!"
