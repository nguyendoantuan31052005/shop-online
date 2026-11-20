$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$products = Import-Csv -LiteralPath (Join-Path $root '.browser-test\products-needing-images.csv') -Encoding utf8
$scriptText = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'download-catalog-photos.ps1') -Raw -Encoding utf8
$queries = @{}
foreach ($match in [regex]::Matches($scriptText, "'(?<id>\d+)'='(?<terms>[^']+)'")) { $queries[$match.Groups['id'].Value] = $match.Groups['terms'].Value }
$queries['53'] = 'cotton jacket|oversized jacket|denim jacket|men jacket|jacket'
$queries['27'] = 'slim cargo pants|cargo trousers|cargo pants|cargo'

$searches = @(
  'jacket OR coat OR parka OR windbreaker OR vest',
  'shirt OR t-shirt OR jersey OR sweater OR cardigan',
  'trousers OR pants OR jeans OR sneaker OR shoes OR backpack OR belt OR bag',
  'lamp OR light OR vase OR urn OR candle OR candlestick',
  'shelf OR shelving OR organizer OR storage OR basket OR box',
  'towel OR bedding OR pillow OR cushion OR blanket OR rug OR mat',
  'tray OR cutting board OR spice jar OR cruet OR planter OR flowerpot'
)
$candidates = [System.Collections.Generic.List[object]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($search in $searches) {
  $encoded = [uri]::EscapeDataString("($search)")
  $uri = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$encoded&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=800&format=json"
  $response = Invoke-RestMethod -Uri $uri -TimeoutSec 25 -Headers @{ 'User-Agent' = 'HomeShoppingCatalog/1.0 (educational project)' }
  foreach ($entry in $response.query.pages.PSObject.Properties) {
    $page = $entry.Value
    if ($page.title -match '\.(pdf|djvu|tiff?|svg)\b|\b(page|catalog|manual|book|magazine|journal|register|dictionary|report)\b' -or -not $page.imageinfo -or $page.imageinfo.Count -eq 0) { continue }
    $info = $page.imageinfo[0]
    $source = [string]$info.descriptionurl
    if ($info.thumburl -notmatch '\.(jpe?g)(\?|$)' -or -not $source -or -not $seen.Add($source)) { continue }
    $candidates.Add([pscustomobject]@{ Title = [string]$page.title; Source = $source; Info = $info })
  }
  Start-Sleep -Milliseconds 1800
}

$imageDirectory = Join-Path $root 'public\images\catalog'
$imageMap = [ordered]@{}
$credits = [System.Collections.Generic.List[object]]::new()
$used = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$jsonPath = Join-Path $imageDirectory 'credits.json'
$mapPath = Join-Path $root 'src\catalog-product-images.json'
$previousCredits = @{}
if (Test-Path -LiteralPath $jsonPath) {
  try { foreach ($item in (Get-Content -LiteralPath $jsonPath -Raw -Encoding utf8 | ConvertFrom-Json)) { $previousCredits[[string]$item.productId] = $item } } catch { }
}

foreach ($product in $products) {
  $id = [string]$product.id
  $terms = [string]$queries[$id]
  if (-not $terms) { throw "Missing query terms for product $id" }
  $selected = $null
  $selectedQuery = ''
  foreach ($query in $terms.Split('|')) {
    $last = ($query -split '\s+')[-1].ToLowerInvariant()
    $pattern = switch -Regex ($last) {
      '^sneakers?$' { 'sneaker|shoe' }
      '^shoes$' { 'shoe|sneaker|derby|brogue|footwear|boot' }
      '^jeans?$' { 'jean|pant|trouser' }
      '^trousers?$' { 'trouser|pant|jean' }
      '^pants$' { 'pant|trouser|jean|cargo' }
      '^shirts?$' { 'shirt|tee|jersey|blouse|top' }
      '^jackets?$' { 'jacket|coat|parka|anorak|windbreaker' }
      '^coats?$' { 'coat|jacket|parka' }
      '^lamps?$' { 'lamp|light' }
      '^vases?$' { 'vase|urn' }
      '^holders?$' { 'holder|candlestick|candle' }
      '^shelves$|^shelf$|^bookshelf$' { 'shelf|shelving|bookcase|bookshelf' }
      '^organizers?$' { 'organizer|storage|holder' }
      '^bottles?$' { 'bottle|cruet|oil' }
      '^boxes$|^box$' { 'box|container|case' }
      '^covers?$' { 'cover|case|pillowcase' }
      '^cushions?$' { 'cushion|pillow' }
      '^blankets?$|^throws?$' { 'blanket|throw|quilt' }
      '^sheets$' { 'sheet|bedding|bed linen' }
      '^towels?$' { 'towel' }
      '^rugs?$' { 'rug|carpet|mat' }
      '^pots?$' { 'pot|planter' }
      '^baskets?$' { 'basket|hamper' }
      '^trays?$' { 'tray' }
      '^cargo$' { 'cargo|pant|trouser' }
      default { [regex]::Escape($last.TrimEnd('s')) }
    }
    foreach ($candidate in $candidates) {
      if ($used.Contains($candidate.Source) -or $candidate.Title -notmatch $pattern) { continue }
      $selected = $candidate; $selectedQuery = $query; break
    }
    if ($selected) { break }
  }
  if (-not $selected) {
    foreach ($candidate in $candidates) {
      if ($used.Contains($candidate.Source)) { continue }
      $selected = $candidate; $selectedQuery = $terms; break
    }
  }
  if (-not $selected) { throw "No unused Wikimedia photo remains for product $id" }

  $fileName = "product-$id.jpg"
  $target = Join-Path $imageDirectory $fileName
  $temp = Join-Path $imageDirectory ("product-$id.download")
  if (-not $previousCredits.ContainsKey($id) -or $previousCredits[$id].sourceUrl -ne $selected.Source) {
    Start-Sleep -Seconds 8
    Invoke-WebRequest -Uri $selected.Info.thumburl -OutFile $temp -TimeoutSec 35 -Headers @{ 'User-Agent' = 'HomeShoppingCatalog/1.0 (educational project)' }
    $bytes = [System.IO.File]::ReadAllBytes($temp)
    if ($bytes.Length -lt 1500 -or $bytes[0] -ne 255 -or $bytes[1] -ne 216) { Remove-Item -LiteralPath $temp -Force; throw "Invalid JPEG for product $id" }
    Move-Item -LiteralPath $temp -Destination $target -Force
  }
  [void]$used.Add($selected.Source)

  $meta = $selected.Info.extmetadata
  $artist = [string]$meta.Artist.value
  if (-not $artist) { $artist = [string]$meta.Credit.value }
  $artist = [System.Net.WebUtility]::HtmlDecode(($artist -replace '<[^>]+>', ' ')).Trim()
  $license = [string]$meta.LicenseShortName.value
  if (-not $license) { $license = 'Public domain / Wikimedia Commons' }
  $imageMap[$id] = "/images/catalog/$fileName"
  $credits.Add([ordered]@{
    productId = [int]$id; productName = $product.name; title = $selected.Title; creator = $artist
    license = $license; licenseVersion = ''; licenseUrl = [string]$meta.LicenseUrl.value
    attribution = "$artist - $license"; sourceUrl = $selected.Source; imageUrl = [string]$selected.Info.thumburl
    localPath = $imageMap[$id]; search = $selectedQuery
  })
  [System.IO.File]::WriteAllText($mapPath, ($imageMap | ConvertTo-Json -Depth 8), $utf8NoBom)
  [System.IO.File]::WriteAllText($jsonPath, ($credits | ConvertTo-Json -Depth 8), $utf8NoBom)
  "Photo $id/$($products.Count) sourced."
}
"Sourced $($credits.Count) unique photos."
