# Minimal static file server for local preview / verification only.
# Not part of the deliverable — students use `python -m http.server` (see README).
# Uses a raw TCP listener so it needs no admin / URL-ACL reservation, and handles
# connections concurrently (runspace pool) with a read timeout so a browser's
# speculative idle sockets can never block real requests.
param([int]$Port = 8123)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot  # project root (parent of .claude)

$handler = {
  param($client, $root)
  $types = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".md"   = "text/markdown; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
  }
  try {
    $client.ReceiveTimeout = 5000
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $requestLine = $reader.ReadLine()
    if ($requestLine) {
      $parts = $requestLine -split " "
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
      $path = ($rawPath -split "\?")[0]
      if ($path -eq "/") { $path = "/index.html" }
      $path = [System.Uri]::UnescapeDataString($path)

      $rel = $path.TrimStart("/") -replace "/", "\"
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
      $rootFull = [System.IO.Path]::GetFullPath($root)

      if ($full.StartsWith($rootFull) -and (Test-Path $full -PathType Leaf)) {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $ctype = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $status = "200 OK"
      } else {
        $status = "404 Not Found"
        $ctype = "text/plain; charset=utf-8"
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      }

      $header = "HTTP/1.1 $status`r`nContent-Type: $ctype`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($bytes, 0, $bytes.Length)
      $stream.Flush()
    }
  } catch {
  } finally {
    $client.Close()
  }
}

$pool = [runspacefactory]::CreateRunspacePool(1, 8)
$pool.Open()

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($true) {
  $client = $listener.AcceptTcpClient()
  $ps = [powershell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($handler).AddArgument($client).AddArgument($root)
  [void]$ps.BeginInvoke()
}
