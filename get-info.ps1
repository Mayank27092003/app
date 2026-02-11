# Simple PowerShell Script to Get Test User Information

$backendUrl = "http://localhost:3001"

Write-Host "`n=== Getting Test User Information ===" -ForegroundColor Cyan

# Test user credentials  
$user1Email = "testuser1@loadrider.com"
$user1Pass = "Test@12345"
$user2Email = "testuser2@loadrider.com"
$user2Pass = "Test@12345"

Write-Host "`nLogging in User 1..." -ForegroundColor Yellow

try {
    $body1 = @{
        email = $user1Email
        password = $user1Pass
    } | ConvertTo-Json
    
    $response1 = Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body1
    
    $user1Id = $response1.user.id
    $user1Token = $response1.token
    
    Write-Host "Success! User 1 ID: $user1Id" -ForegroundColor Green
}
catch {
    Write-Host "Failed to login User 1. Creating new user..." -ForegroundColor Yellow
    
    $createBody1 = @{
        email = $user1Email
        password = $user1Pass
        userName = "testuser1"
        phoneCountryCode = "+1"
        phoneNumber = "2345678901"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/signup" -Method POST -ContentType "application/json" -Body $createBody1 | Out-Null
        Start-Sleep -Seconds 2
        $response1 = Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body1
        $user1Id = $response1.user.id
        $user1Token = $response1.token
        Write-Host "User 1 created! ID: $user1Id" -ForegroundColor Green
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
}

Write-Host "`nLogging in User 2..." -ForegroundColor Yellow

try {
    $body2 = @{
        email = $user2Email
        password = $user2Pass
    } | ConvertTo-Json
    
    $response2 = Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body2
    
    $user2Id = $response2.user.id
    $user2Token = $response2.token
    
    Write-Host "Success! User 2 ID: $user2Id" -ForegroundColor Green
}
catch {
    Write-Host "Failed to login User 2. Creating new user..." -ForegroundColor Yellow
    
    $createBody2 = @{
        email = $user2Email
        password = $user2Pass
        userName = "testuser2"
        phoneCountryCode = "+1"
        phoneNumber = "2345678902"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/signup" -Method POST -ContentType "application/json" -Body $createBody2 | Out-Null
        Start-Sleep -Seconds 2
        $response2 = Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body2
        $user2Id = $response2.user.id
        $user2Token = $response2.token
        Write-Host "User 2 created! ID: $user2Id" -ForegroundColor Green
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
}

Write-Host "`nGetting/Creating Conversation..." -ForegroundColor Yellow

try {
    $conversations = Invoke-RestMethod -Uri "$backendUrl/api/v1/conversations" -Method GET -Headers @{"Authorization"="Bearer $user1Token"}
    
    if ($conversations.data -and $conversations.data.length -gt 0) {
        $conversationId = $conversations.data[0].id
        Write-Host "Found existing conversation: $conversationId" -ForegroundColor Green
    }
    else {
        throw "No conversations found"
    }
}
catch {
    Write-Host "Creating new conversation..." -ForegroundColor Yellow
    $convBody = @{ receiverUserId = $user2Id } | ConvertTo-Json
    $conv = Invoke-RestMethod -Uri "$backendUrl/api/v1/conversations/direct" -Method POST -Headers @{"Authorization"="Bearer $user1Token"} -ContentType "application/json" -Body $convBody
    $conversationId = $conv.data.id
    Write-Host "Created new conversation: $conversationId" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "ALL INFORMATION READY!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "WINDOW 1 (User A):" -ForegroundColor Cyan
Write-Host "  Backend URL: http://localhost:3001"
Write-Host "  Auth Token: $user1Token" -ForegroundColor Yellow
Write-Host "  User ID: $user1Id" -ForegroundColor Yellow
Write-Host "  Conversation ID: $conversationId" -ForegroundColor Yellow
Write-Host "  Other User ID: $user2Id" -ForegroundColor Yellow

Write-Host "`nWINDOW 2 (User B):" -ForegroundColor Cyan
Write-Host "  Backend URL: http://localhost:3001"
Write-Host "  Auth Token: $user2Token" -ForegroundColor Yellow
Write-Host "  User ID: $user2Id" -ForegroundColor Yellow
Write-Host "  Conversation ID: $conversationId" -ForegroundColor Yellow
Write-Host "  Other User ID: $user1Id" -ForegroundColor Yellow

Write-Host "`nTest Page: http://localhost:3001/public/test-audio.html`n" -ForegroundColor Cyan

# Save to file
@"
WebRTC Audio Test Information
Generated: $(Get-Date)

WINDOW 1 (User A):
Backend URL: http://localhost:3001
Auth Token: $user1Token
User ID: $user1Id
Conversation ID: $conversationId
Other User ID: $user2Id

WINDOW 2 (User B):
Backend URL: http://localhost:3001
Auth Token: $user2Token
User ID: $user2Id
Conversation ID: $conversationId
Other User ID: $user1Id

Test Page: http://localhost:3001/public/test-audio.html
"@ | Out-File -FilePath "test-info.txt" -Encoding UTF8

Write-Host "Info saved to: test-info.txt" -ForegroundColor Green
