# Minimal static file server for local preview / verification only.
# Not part of the deliverable — students use `python -m http.server` (see README).
# Uses a raw TCP listener so it needs no admin / URL-ACL reservation.
param([int]$Port = 8123)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot  # project root (parent of .claude)

$types = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".md"   = "text/markdown; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { $client.Close(); continue }

    $parts = $requestLine -split " "
    $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
    $path = ($rawPath -split "\?")[0]
    if ($path -eq "/") { $path = "/index.html" }
    $path = [System.Uri]::UnescapeDataString($path)

    # Resolve safely within root (block path traversal).
    $rel = $path.TrimStart("/") -replace "/", "\"
    $full = Join-Path $root $rel
    $fullResolved = [System.IO.Path]::GetFullPath($full)

    $bytes = $null
    $status = "200 OK"
    $ctype = "application/octet-stream"

    if ($fullResolved.StartsWith([System.IO.Path]::GetFullPath($root)) -and (Test-Path $fullResolved -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($fullResolved).ToLower()
      if ($types.ContainsKey($ext)) { $ctype = $types[$ext] }
      $bytes = [System.IO.File]::ReadAllBytes($fullResolved)
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
  } catch {
    Write-Host "err: $($_.Exception.Message)"
  } finally {
    $client.Close()
  }
}
