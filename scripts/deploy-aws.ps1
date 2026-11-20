[CmdletBinding()]
param(
  [Parameter()]
  [ValidatePattern('^[A-Za-z0-9._-]{1,80}$')]
  [string]$Version = ('release-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$statePath = Join-Path $repoRoot 'deploy/aws-deploy-state.json'
$state = Get-Content -LiteralPath $statePath -Raw -Encoding utf8 | ConvertFrom-Json
$aws = Get-Command aws -ErrorAction SilentlyContinue
if (-not $aws) { throw 'Không tìm thấy AWS CLI. Cài AWS CLI v2 và đăng nhập trước.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Không tìm thấy Docker CLI. Khởi động Docker Desktop trước.' }

function Invoke-AwsJson([string[]]$Arguments) {
  $result = & $aws.Source @Arguments
  if ($LASTEXITCODE -ne 0) { throw "AWS CLI thất bại: aws $($Arguments -join ' ')" }
  if (-not $result) { return $null }
  return ($result -join "`n") | ConvertFrom-Json
}

$identity = Invoke-AwsJson @('sts','get-caller-identity','--output','json')
if ($identity.Account -ne $state.Account) { throw "AWS account hiện tại không khớp account dự án ($($state.Account)); dừng để tránh deploy nhầm." }
$stack = Invoke-AwsJson @('cloudformation','describe-stacks','--stack-name',$state.StackName,'--region',$state.Region,'--output','json')
$outputs = $stack.Stacks[0].Outputs
$instanceId = ($outputs | Where-Object OutputKey -eq 'InstanceId' | Select-Object -First 1).OutputValue
$backupBucket = ($outputs | Where-Object OutputKey -eq 'BackupBucketName' | Select-Object -First 1).OutputValue
$productImageBucket = ($outputs | Where-Object OutputKey -eq 'ProductImageBucketName' | Select-Object -First 1).OutputValue
if (-not $instanceId -or -not $backupBucket) { throw 'CloudFormation stack thiếu InstanceId hoặc BackupBucketName; không tiếp tục deploy.' }
if ($stack.Stacks[0].StackStatus -notin @('CREATE_COMPLETE','UPDATE_COMPLETE')) { throw "Stack đang ở trạng thái $($stack.Stacks[0].StackStatus); hãy đợi stack ổn định." }

$image = $state.EcrImageUri -replace ':[^/:]+$', (':' + $Version)
$registry = $image.Split('/')[0]
$dockerConfigArgs = @()
if ($env:DOCKER_CONFIG) { $dockerConfigArgs = @('--config', $env:DOCKER_CONFIG) }
$ownsDockerAuthConfig = $false
if (-not $env:DOCKER_AUTH_CONFIG) {
  $password = & $aws.Source ecr get-login-password --region $state.Region
  if ($LASTEXITCODE -ne 0 -or -not $password) { throw 'Không lấy được token ECR.' }
  $encodedAuth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("AWS:$password"))
  $env:DOCKER_AUTH_CONFIG = (@{ auths = @{ $registry = @{ auth = $encodedAuth } } } | ConvertTo-Json -Compress -Depth 4)
  $ownsDockerAuthConfig = $true
}
Push-Location $repoRoot
try {
  & docker @dockerConfigArgs build --platform linux/amd64 --build-arg "APP_VERSION=$Version" --tag $image .
  if ($LASTEXITCODE -ne 0) { throw 'Docker build thất bại.' }
  & docker @dockerConfigArgs push $image
  if ($LASTEXITCODE -ne 0) { throw 'Đẩy image lên ECR thất bại.' }
} finally {
  if ($ownsDockerAuthConfig) {
    Remove-Item Env:DOCKER_AUTH_CONFIG -ErrorAction SilentlyContinue
    $password = $null
    $encodedAuth = $null
  }
  Pop-Location
}

$remote = @"
set -eu
IMAGE='$image'
REGISTRY='$registry'
REGION='$($state.Region)'
SECRET_ARN='$($state.AppSecretArn)'
BACKUP_BUCKET='$backupBucket'
PRODUCT_IMAGE_BUCKET='$productImageBucket'
VERSION='$Version'
BACKUP="/tmp/shop-predeploy-$Version.tar.gz"
tar -czf "`$BACKUP" -C /opt/shop data
aws s3 cp "`$BACKUP" "s3://`$BACKUP_BUCKET/daily/predeploy-$Version.tar.gz" --sse AES256 --region "`$REGION"
rm -f "`$BACKUP"
APP_SECRET=`$(aws secretsmanager get-secret-value --secret-id "`$SECRET_ARN" --query SecretString --output text --region "`$REGION")
ADMIN_TOKEN=`$(printf '%s' "`$APP_SECRET" | jq -r '.ADMIN_TOKEN // empty')
JWT_SECRET=`$(printf '%s' "`$APP_SECRET" | jq -r '.JWT_SECRET // empty')
PUBLIC_URL=`$(printf '%s' "`$APP_SECRET" | jq -r '.PUBLIC_URL // empty')
RESEND_API_KEY=`$(printf '%s' "`$APP_SECRET" | jq -r '.RESEND_API_KEY // empty')
MAIL_FROM=`$(printf '%s' "`$APP_SECRET" | jq -r '.MAIL_FROM // empty')
GHN_BASE_URL=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_BASE_URL // empty')
GHN_TOKEN=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_TOKEN // empty')
GHN_SHOP_ID=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_SHOP_ID // empty')
GHN_AUTO_CREATE_ORDERS=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_AUTO_CREATE_ORDERS // empty')
GHN_WEBHOOK_SECRET=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_WEBHOOK_SECRET // empty')
GHN_FROM_NAME=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_FROM_NAME // empty')
GHN_FROM_PHONE=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_FROM_PHONE // empty')
GHN_FROM_ADDRESS=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_FROM_ADDRESS // empty')
GHN_FROM_PROVINCE=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_FROM_PROVINCE // empty')
GHN_FROM_WARD=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_FROM_WARD // empty')
GHN_FROM_DISTRICT=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_FROM_DISTRICT // empty')
GHN_DEFAULT_WEIGHT_G=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_DEFAULT_WEIGHT_G // empty')
GHN_DEFAULT_LENGTH_CM=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_DEFAULT_LENGTH_CM // empty')
GHN_DEFAULT_WIDTH_CM=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_DEFAULT_WIDTH_CM // empty')
GHN_DEFAULT_HEIGHT_CM=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_DEFAULT_HEIGHT_CM // empty')
GHN_REQUIRED_NOTE=`$(printf '%s' "`$APP_SECRET" | jq -r '.GHN_REQUIRED_NOTE // empty')
WEATHER_API_KEY=`$(printf '%s' "`$APP_SECRET" | jq -r '.WEATHER_API_KEY // empty')
unset APP_SECRET
test -n "`$ADMIN_TOKEN" && test -n "`$JWT_SECRET"
PRODUCT_IMAGE_ENV=""
if [ -n "`$PRODUCT_IMAGE_BUCKET" ]; then
  PRODUCT_IMAGE_ENV="-e AWS_REGION=`$REGION -e PRODUCT_IMAGE_BUCKET=`$PRODUCT_IMAGE_BUCKET -e PRODUCT_IMAGE_PREFIX=product-images -e PRODUCT_IMAGE_BASE_PATH=/product-images"
fi
aws ecr get-login-password --region "`$REGION" | docker login --username AWS --password-stdin "`$REGISTRY"
docker pull "`$IMAGE"
docker rm -f shop-online-previous >/dev/null 2>&1 || true
docker stop shop-online
docker rename shop-online shop-online-previous
if ! docker run -d --name shop-online --restart unless-stopped -p 80:3000 -v /opt/shop/data:/data -e PORT=3000 -e DB_PATH=/data/shop.json -e COOKIE_SECURE=true `$PRODUCT_IMAGE_ENV -e ADMIN_TOKEN="`$ADMIN_TOKEN" -e JWT_SECRET="`$JWT_SECRET" -e PUBLIC_URL="`$PUBLIC_URL" -e RESEND_API_KEY="`$RESEND_API_KEY" -e MAIL_FROM="`$MAIL_FROM" -e GHN_BASE_URL="`$GHN_BASE_URL" -e GHN_TOKEN="`$GHN_TOKEN" -e GHN_SHOP_ID="`$GHN_SHOP_ID" -e GHN_AUTO_CREATE_ORDERS="`$GHN_AUTO_CREATE_ORDERS" -e GHN_WEBHOOK_SECRET="`$GHN_WEBHOOK_SECRET" -e GHN_FROM_NAME="`$GHN_FROM_NAME" -e GHN_FROM_PHONE="`$GHN_FROM_PHONE" -e GHN_FROM_ADDRESS="`$GHN_FROM_ADDRESS" -e GHN_FROM_PROVINCE="`$GHN_FROM_PROVINCE" -e GHN_FROM_WARD="`$GHN_FROM_WARD" -e GHN_FROM_DISTRICT="`$GHN_FROM_DISTRICT" -e GHN_DEFAULT_WEIGHT_G="`$GHN_DEFAULT_WEIGHT_G" -e GHN_DEFAULT_LENGTH_CM="`$GHN_DEFAULT_LENGTH_CM" -e GHN_DEFAULT_WIDTH_CM="`$GHN_DEFAULT_WIDTH_CM" -e GHN_DEFAULT_HEIGHT_CM="`$GHN_DEFAULT_HEIGHT_CM" -e GHN_REQUIRED_NOTE="`$GHN_REQUIRED_NOTE" -e WEATHER_API_KEY="`$WEATHER_API_KEY" "`$IMAGE"; then
  docker rename shop-online-previous shop-online
  docker start shop-online
  exit 1
fi
unset ADMIN_TOKEN JWT_SECRET PUBLIC_URL RESEND_API_KEY MAIL_FROM GHN_BASE_URL GHN_TOKEN GHN_SHOP_ID GHN_AUTO_CREATE_ORDERS GHN_WEBHOOK_SECRET GHN_FROM_NAME GHN_FROM_PHONE GHN_FROM_ADDRESS GHN_FROM_PROVINCE GHN_FROM_WARD GHN_FROM_DISTRICT GHN_DEFAULT_WEIGHT_G GHN_DEFAULT_LENGTH_CM GHN_DEFAULT_WIDTH_CM GHN_DEFAULT_HEIGHT_CM GHN_REQUIRED_NOTE WEATHER_API_KEY PRODUCT_IMAGE_BUCKET
i=0
while [ "`$i" -lt 30 ]; do
  if curl --fail --silent http://127.0.0.1/health | grep -F '"version":"'"`$VERSION"'"' >/dev/null; then
    docker rm -f shop-online-previous >/dev/null
    docker image prune -af >/dev/null
    echo "Deployment healthy: `$VERSION"
    exit 0
  fi
  sleep 2
  i=`$((i + 1))
done
echo 'New container did not become healthy; restoring previous image.'
docker logs --tail 80 shop-online || true
docker rm -f shop-online || true
docker rename shop-online-previous shop-online
docker start shop-online
exit 1
"@

$tempCommands = Join-Path ([IO.Path]::GetTempPath()) ('shop-ssm-' + [guid]::NewGuid().ToString('N') + '.json')
try {
  $commandBody = @{ commands = @($remote) } | ConvertTo-Json -Depth 4
  [IO.File]::WriteAllText($tempCommands, $commandBody, [Text.UTF8Encoding]::new($false))
  $sent = Invoke-AwsJson @('ssm','send-command','--instance-ids',$instanceId,'--document-name','AWS-RunShellScript','--parameters',"file://$tempCommands",'--comment',"shop-online deploy $Version",'--region',$state.Region,'--output','json')
} finally {
  Remove-Item -LiteralPath $tempCommands -Force -ErrorAction SilentlyContinue
}

$commandId = $sent.Command.CommandId
if (-not $commandId) { throw 'SSM không trả command ID.' }
Write-Host "SSM deployment command: $commandId"
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Seconds 5
  try { $invocation = Invoke-AwsJson @('ssm','get-command-invocation','--command-id',$commandId,'--instance-id',$instanceId,'--region',$state.Region,'--output','json') }
  catch { continue }
  if ($invocation.Status -in @('Success','Failed','Cancelled','TimedOut')) { break }
}
if ($invocation.Status -ne 'Success') {
  Write-Host $invocation.StandardOutputContent
  Write-Error $invocation.StandardErrorContent
  throw "AWS deploy không thành công (SSM status: $($invocation.Status))."
}
Write-Host $invocation.StandardOutputContent
Write-Host "Đã triển khai $Version. URL: $(($outputs | Where-Object OutputKey -eq 'ShopUrl' | Select-Object -First 1).OutputValue)"
