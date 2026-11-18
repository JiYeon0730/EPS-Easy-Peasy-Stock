# EPS local diagnostic: sends only a minimal test message, no brokerage image.
# Runs from the EPS project root. Never echoes your API key.
$ErrorActionPreference = 'Stop'
$envPath = Join-Path (Get-Location) '.env.local'
if (-not (Test-Path $envPath)) {
  Write-Host '[EPS] .env.local 파일이 없습니다.'
  exit 1
}
$config = @{}
foreach ($line in (Get-Content $envPath -Encoding UTF8)) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
    $config[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}
$key = $config['GEMINI_API_KEY']
$model = $config['GEMINI_VISION_MODEL']
if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host '[EPS] GEMINI_API_KEY 값이 비어 있습니다.'
  exit 1
}
if ([string]::IsNullOrWhiteSpace($model)) { $model = 'gemini-3.8-flash' }
$uri = "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent"
$payload = @{ contents = @(@{ parts = @(@{ text = 'Reply with OK only.' }) }) } | ConvertTo-Json -Depth 6 -Compress
try {
  $result = Invoke-RestMethod -Method Post -Uri $uri -Headers @{ 'x-goog-api-key' = $key } -ContentType 'application/json' -Body $payload -TimeoutSec 30
  Write-Host "[EPS] 성공 (HTTP 200): ${model} 모델이 간단한 텍스트 요청에 응답했습니다."
  Write-Host '[EPS] EPS 캡처 분석이 계속 실패한다면 이미지 요청 본문 또는 응답 스키마를 점검하세요.'
} catch {
  $statusCode = $null
  if ($null -ne $_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
  }
  if ($null -ne $statusCode) {
    Write-Host "[EPS] 실패: Gemini HTTP $statusCode (모델: $model)"
    switch ($statusCode) {
      400 { Write-Host '요청 형식 또는 모델 설정을 확인하세요.' }
      401 { Write-Host 'API 키가 유효한지 확인하세요.' }
      402 { Write-Host '결제/크레딧 상태를 확인하세요.' }
      403 { Write-Host 'API 키 및 프로젝트 이용 권한을 확인하세요.' }
      404 { Write-Host '모델 이름 또는 API 엔드포인트 호환성을 확인하세요.' }
      429 { Write-Host '할당량 및 요청 한도를 확인하세요.' }
      default { Write-Host '서버 상태나 네트워크 연결을 확인하세요.' }
    }
  } else {
    Write-Host '[EPS] HTTP 응답을 받지 못했습니다. DNS/방화벽/TLS/네트워크 등을 확인하세요.'
  }
  exit 1
} finally {
  Remove-Variable key -ErrorAction SilentlyContinue
}
