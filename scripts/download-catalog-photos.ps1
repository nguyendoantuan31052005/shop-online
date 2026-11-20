$ErrorActionPreference = 'Stop'
$productsPath = Join-Path $PSScriptRoot '..\.browser-test\products-needing-images.csv'
$imageDirectory = Join-Path $PSScriptRoot '..\public\images\catalog'
$mapPath = Join-Path $PSScriptRoot '..\src\catalog-product-images.json'
$creditsPath = Join-Path $imageDirectory 'credits.json'

$queries = @{
  '13'='brown bomber jacket|bomber jacket'; '24'='denim jacket'; '32'='men sports t shirt|sports t shirt'; '40'='sports backpack|backpack'; '52'='windbreaker jacket';
  '63'='black oversized t shirt|black t shirt'; '64'='crew neck t shirt|plain t shirt'; '26'='ripped jeans'; '56'='straight leg jeans'; '68'='low top sneakers|low top shoes';
  '35'='travel backpack'; '69'='leather derby shoes|leather dress shoes'; '70'='leather belt'; '22'='printed button shirt'; '30'='navy blue shirt';
  '51'='camel jacket|brown jacket'; '61'='checkered shirt|plaid shirt'; '21'='light wool coat|wool coat'; '29'='black long sleeve shirt'; '34'='men business shirt|business shirt';
  '54'='black bomber jacket|black jacket'; '60'='white linen shirt'; '25'='sleeveless windbreaker|vest jacket'; '31'='striped shirt'; '53'='oversized cotton jacket';
  '62'='denim shirt'; '27'='slim cargo pants|cargo trousers|cargo pants|cargo'; '57'='jogger pants'; '23'='green parka jacket|parka jacket'; '28'='men dress pants|formal trousers';
  '55'='men wool coat'; '59'='khaki slim pants|khaki trousers'; '65'='plain t shirt'; '33'='sports jogger pants'; '58'='utility cargo pants';
  '66'='turtleneck sweater'; '67'='cardigan sweater'; '71'='crossbody bag';
  '76'='bedside lamp'; '102'='table lamp fabric shade|table lamp'; '106'='round bedside lamp|bedside lamp'; '109'='tall ceramic vase'; '113'='ceramic candle holder|candle holder';
  '78'='bathroom shelf|bathroom organizer'; '121'='corner shower caddy|bathroom shelf'; '94'='glass spice jars'; '95'='oil cruet bottle|oil bottle'; '107'='bedside organizer box|jewelry organizer';
  '114'='fabric storage basket'; '115'='storage box with lid|storage container'; '101'='small ceramic vase'; '112'='decorative ceramic vase'; '98'='linen pillow cover|cushion cover';
  '99'='chair cushion'; '100'='sofa throw blanket'; '104'='cotton bedding set|bed sheets'; '105'='bed runner blanket|bed throw'; '96'='cotton kitchen towels';
  '118'='bath towel set|bath towels'; '119'='hair towel wrap|hair towel'; '90'='cotton pillowcase|pillowcase'; '108'='bedside rug|bedroom rug'; '120'='bath mat';
  '85'='wood serving tray'; '91'='bedside tray'; '97'='breakfast tray'; '116'='makeup organizer tray|drawer organizer'; '87'='ceramic plant pot|plant pot';
  '110'='small plant pot'; '111'='set of plant pots'; '93'='bamboo cutting board'; '103'='small bookshelf|bookshelf'; '117'='two tier desk shelf|bookshelf'
}
$queries['53'] = 'cotton jacket|oversized jacket|denim jacket|men jacket|jacket'

$products = Import-Csv -LiteralPath $productsPath -Encoding utf8
New-Item -ItemType Directory -Path $imageDirectory -Force | Out-Null
$usedSources = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$imageMap = [ordered]@{}
$credits = [System.Collections.Generic.List[object]]::new()
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

foreach ($product in $products) {
  $productId = [string]$product.id
  if (-not $queries.ContainsKey($productId)) { throw "No search query for product $productId" }
  $fileName = "product-$productId.jpg"
  $targetPath = Join-Path $imageDirectory $fileName
  $selected = $null
  $selectedTitle = ''
  $lastError = $null

  foreach ($query in $queries[$productId].Split('|')) {
    for ($page = 1; $page -le 3 -and -not $selected; $page++) {
      $encoded = [uri]::EscapeDataString($query)
      $searchNoun = ($query -split '\s+')[-1].ToLowerInvariant()
      $nounPattern = switch -Regex ($searchNoun) {
        '^sneakers?$' { 'sneaker|shoe' }
        '^shoes$' { 'shoe|sneaker|derby|brogue|footwear|boot' }
        '^jeans?$' { 'jean|pant|trouser' }
        '^trousers?$' { 'trouser|pant|jean' }
        '^pants$' { 'pant|trouser|jean|cargo' }
        '^cargo$' { 'cargo|pant|trouser' }
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
        default { [regex]::Escape($searchNoun.TrimEnd('s')) }
      }
      $offset = ($page - 1) * 30
      $searchUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$encoded&gsrnamespace=6&gsrlimit=30&gsroffset=$offset&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=800&format=json"
      $response = $null
      for ($attempt = 1; $attempt -le 2 -and -not $response; $attempt++) {
        try { $response = Invoke-RestMethod -Uri $searchUrl -TimeoutSec 30 -Headers @{ 'User-Agent' = 'HomeShoppingCatalog/1.0 (educational project)' } }
        catch { $lastError = $_.Exception.Message; Start-Sleep -Seconds (15 * $attempt) }
      }
      if (-not $response) { continue }
      Start-Sleep -Milliseconds 1200
      foreach ($pageEntry in $response.query.pages.PSObject.Properties) {
        $pageInfo = $pageEntry.Value
        $pageTitle = [string]$pageInfo.title
        if ($pageTitle -match '\.(pdf|djvu|tiff?|svg)\b') { continue }
        if ($pageTitle -notmatch $nounPattern) { continue }
        if (-not $pageInfo.imageinfo -or $pageInfo.imageinfo.Count -eq 0) { continue }
        $candidate = $pageInfo.imageinfo[0]
        $imageUrl = [string]$candidate.thumburl
        $sourceKey = [string]$candidate.descriptionurl
        if (-not $imageUrl -or $imageUrl -notmatch '\.(jpe?g)(\?|$)' -or $usedSources.Contains($sourceKey)) { continue }
        $tempPath = Join-Path $imageDirectory ("product-$productId.download")
        try {
          Invoke-WebRequest -Uri $imageUrl -OutFile $tempPath -TimeoutSec 35 -Headers @{ 'User-Agent' = 'HomeShoppingCatalog/1.0 (educational project)' }
          $bytes = [System.IO.File]::ReadAllBytes($tempPath)
          if ($bytes.Length -lt 1500 -or $bytes[0] -ne 255 -or $bytes[1] -ne 216) { throw 'Image is not a valid JPEG' }
          Move-Item -LiteralPath $tempPath -Destination $targetPath -Force
          $selected = $candidate
          $selectedTitle = $pageTitle
          [void]$usedSources.Add($sourceKey)
          break
        } catch {
          $lastError = $_.Exception.Message
          if (Test-Path -LiteralPath $tempPath) { Remove-Item -LiteralPath $tempPath }
        }
      }
    }
    if ($selected) { break }
  }

  if (-not $selected) { throw "Could not source a unique photo for product $productId ($($product.name)): $lastError" }
  $imageMap[$productId] = "/images/catalog/$fileName"
  $licenseUrl = [string]$selected.extmetadata.LicenseUrl.value
  $licenseName = [string]$selected.extmetadata.LicenseShortName.value
  if (-not $licenseName) { $licenseName = 'Public domain / Wikimedia Commons' }
  $creator = [string]$selected.extmetadata.Artist.value
  if (-not $creator) { $creator = [string]$selected.extmetadata.Credit.value }
  $creator = [System.Net.WebUtility]::HtmlDecode(($creator -replace '<[^>]+>', ' ')).Trim()
  $credits.Add([ordered]@{
    productId = [int]$productId
    productName = $product.name
    title = $selectedTitle
    creator = $creator
    license = $licenseName
    licenseVersion = ''
    licenseUrl = $licenseUrl
    attribution = "$creator - $licenseName"
    sourceUrl = $selected.descriptionurl
    imageUrl = $selected.thumburl
    localPath = $imageMap[$productId]
    search = $queries[$productId]
  })
  [System.IO.File]::WriteAllText($mapPath, ($imageMap | ConvertTo-Json -Depth 8), $utf8NoBom)
  [System.IO.File]::WriteAllText($creditsPath, ($credits | ConvertTo-Json -Depth 8), $utf8NoBom)
  "Downloaded $productId/$($products.Count): $fileName"
}

$jsonOptions = @{ Depth = 8 }
[System.IO.File]::WriteAllText($mapPath, ($imageMap | ConvertTo-Json @jsonOptions), $utf8NoBom)
[System.IO.File]::WriteAllText($creditsPath, ($credits | ConvertTo-Json @jsonOptions), $utf8NoBom)
"Sourced $($credits.Count) unique photos and wrote the image map."

\n